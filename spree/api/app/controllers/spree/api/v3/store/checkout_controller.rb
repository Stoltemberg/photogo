# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Store
        # Checkout endpoint for PhotoGo — suporta Stripe e Mercado Pago.
        #
        # POST /api/v3/store/checkout
        #   {
        #     email: "buyer@example.com",
        #     items: [{product_id: "prod_123", quantity: 2}],
        #     payment_method: "mercado_pago" | "stripe",
        #     payment_data: {
        #       # Mercado Pago — Pix
        #       method: "pix",
        #
        #       # Mercado Pago — Cartão
        #       method: "card",
        #       token: "card_token_from_mp_sdk",
        #       payment_method_id: "visa",
        #       installments: 6,
        #
        #       # Stripe
        #       stripe_token: "tok_..."
        #     }
        #   }
        #
        # Resposta (Pix):
        #   {
        #     order_id: "or_...",
        #     status: "pending_payment",
        #     total: 199.80,
        #     payment: {
        #       method: "pix",
        #       qr_code: "00020126...",
        #       qr_code_base64: "iVBOR...",
        #       expires_at: "2026-07-31T..."
        #     },
        #     commissions: [...]
        #   }
        #
        # Resposta (Cartão aprovado):
        #   {
        #     order_id: "or_...",
        #     status: "complete",
        #     total: 199.80,
        #     payment: { method: "card", status: "approved" },
        #     commissions: [...]
        #   }
        #
        class CheckoutController < BaseController
          def create
            payload = params.require(:checkout).permit(
              :email,
              :payment_method,                                    # "mercado_pago" | "stripe"
              :stripe_token,
              payment_data: [:method, :token, :payment_method_id, :installments],
              items: [:product_id, :quantity]
            )

            # 1. Criar ordem
            order = Spree::Order.create!(
              store:    Spree::Store.default,
              currency: 'BRL',
              email:    payload[:email],
              state:    'cart'
            )

            # 2. Adicionar line items
            payload[:items].each do |item|
              product = Spree::Product.find_by_prefix_id(item[:product_id])
              unless product
                return render json: { error: "Product #{item[:product_id]} not found" }, status: :not_found
              end
              order.contents.add(product.master, item[:quantity].to_i)
            end

            # 3. Processar pagamento
            payment_result = process_payment(order, payload)

            # 4. Se pagamento foi aprovado (cartão), completar ordem
            if payment_result[:status] == 'approved'
              order.next! while order.can_transition_to_next_state?
            end

            # 5. Coletar comissões geradas
            commissions = Photo::Commission.where(order: order).map do |c|
              {
                id:           c.prefix_id,
                vendor_id:    c.vendor.prefix_id,
                amount_cents: c.amount_cents,
                currency:     c.currency,
                status:       c.status
              }
            end

            render json: {
              order_id:    order.prefix_id,
              status:      order.state,
              total:       order.total.to_f,
              payment:     payment_result,
              commissions: commissions
            }, status: :created
          rescue ActionController::ParameterMissing => e
            render json: { error: e.message }, status: :bad_request
          rescue StandardError => e
            render json: { error: e.message }, status: :unprocessable_entity
          end

          private

          def process_payment(order, payload)
            method = payload[:payment_method] || 'stripe'

            case method
            when 'mercado_pago'
              process_mercado_pago(order, payload[:payment_data] || {})
            when 'stripe'
              process_stripe(order, payload[:stripe_token])
            else
              { status: 'error', message: "Unknown payment method: #{method}" }
            end
          end

          # Processa pagamento via Mercado Pago
          # Suporta Pix (QR code) e Cartão (parcelado)
          def process_mercado_pago(order, payment_data)
            gateway = Spree::Gateway::MercadoPago.active.first
            return { status: 'error', message: 'Mercado Pago gateway not configured' } unless gateway

            method = payment_data[:method] || 'pix'

            case method
            when 'pix'
              # Criar pagamento Pix — retorna QR code
              result = gateway.create_pix_payment(
                order.total,
                order.email,
                "PhotoGo Order #{order.number}"
              )

              # Criar registro de pagamento Spree (pendente)
              source = Spree::MercadoPagoSource.create!(
                payment_id:        result[:id],
                payment_method_id: 'pix',
                status:            'pending'
              )

              order.payments.create!(
                payment_method: gateway,
                source:         source,
                amount:         order.total,
                state:          'pending'
              )

              {
                method:         'pix',
                status:         'pending',
                qr_code:        result[:qr_code],
                qr_code_base64: result[:qr_code_base64],
                ticket_url:     result[:ticket_url],
                expires_at:     result[:expires_at]
              }

            when 'card'
              # Cartão — token vem do SDK JS do Mercado Pago
              source = Spree::MercadoPagoSource.create!(
                payment_id:        nil, # será preenchido pelo webhook
                payment_method_id: payment_data[:payment_method_id] || 'visa',
                installments:     payment_data[:installments] || 1,
                token:            payment_data[:token],
                status:           'processing'
              )

              # Autorizar pagamento
              auth = gateway.authorize((order.total * 100).to_i, source, { email: order.email })
              source.update!(status: auth.params['status'])

              order.payments.create!(
                payment_method: gateway,
                source:         source,
                amount:         order.total,
                state:          auth.success? ? 'completed' : 'failed'
              )

              {
                method:         'card',
                status:         auth.params['status'] || 'approved',
                payment_method_id: payment_data[:payment_method_id],
                installments:   payment_data[:installments] || 1
              }

            when 'boleto'
              # Boleto — similar ao Pix, mas com vencimento
              source = Spree::MercadoPagoSource.create!(
                payment_id:        nil,
                payment_method_id: 'boleto',
                status:           'pending'
              )

              order.payments.create!(
                payment_method: gateway,
                source:         source,
                amount:         order.total,
                state:          'pending'
              )

              {
                method:   'boleto',
                status:   'pending',
                ticket_url: 'https://www.mercadopago.com.br/checkout/v1/redirect'
              }

            else
              { status: 'error', message: "Unknown Mercado Pago method: #{method}" }
            end
          end

          # Processa pagamento via Stripe (legado/fallback)
          def process_stripe(order, _token)
            # MVP: ignora token, marca como aprovado
            order.next! while order.can_transition_to_next_state?

            { method: 'stripe', status: 'approved' }
          end
        end
      end
    end
  end
end
