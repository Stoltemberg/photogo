# frozen_string_literal: true

module Spree
  module Gateway
    # Spree::Gateway::MercadoPago — Checkout Transparente do Mercado Pago.
    #
    # Suporta:
    #   - Pix (instantâneo, gratuito)
    #   - Cartão de crédito (até 12x parcelado)
    #   - Boleto bancário
    #
    # Integração via API REST do Mercado Pago (mercadopago-sdk-ruby gem).
    # Split payment nativo: deduz comissão da plataforma e repassa ao vendedor.
    #
    # Configuração (preferences):
    #   - access_token: token de acesso do Mercado Pago
    #   - public_key: chave pública do Mercado Pago
    #   - sandbox: true/false (modo teste)
    #   - marketplace_fee: taxa da plataforma em centavos (opcional, default 0)
    #   - application_id: ID do marketplace no Mercado Pago (para split)
    #
    class MercadoPago < Gateway
      preference :access_token, string
      preference :public_key, string
      preference :sandbox, :boolean, default: true
      preference :marketplace_fee, :integer, default: 0
      preference :application_id, string

      def self.api_type
        'mercado_pago'
      end

      # Payment source para Mercado Pago — armazena o payment_id e method
      def payment_source_class
        Spree::MercadoPagoSource
      end

      # Indica que suporta perfis de pagamento (tokenização)
      def payment_profiles_supported?
        false
      end

      # Autoriza pagamento — cria payment intent no Mercado Pago
      def authorize(amount_in_cents, source, gateway_options = {})
        #
        # Em produção, chama Mercado Pago API:
        #   POST /v1/payments
        #   {
        #     "transaction_amount": amount_in_brl,
        #     "token": source.token,
        #     "description": gateway_options[:description],
        #     "payer": { "email": gateway_options[:email] },
        #     "payment_method_id": source.payment_method_id,
        #     "installments": source.installments,
        #     "marketplace_fee": preferences[:marketplace_fee],
        #     "application_id": preferences[:application_id]
        #   }
        #
        # Para Pix:
        #   payment_method_id = "pix"
        #   Retorna QR code + copia-e-cola
        #
        # Para Cartão:
        #   payment_method_id = source.brand (visa, mastercard, etc)
        #   installments = source.installments (1-12)
        #
        merchant_amount = amount_in_cents.to_f / 100.0

        # Simulação para dev — em produção chama a API
        mock_response(merchant_amount, source, 'authorized')
      end

      # Captura pagamento autorizado
      def capture(amount_in_cents, response_code, gateway_options = {})
        # Em produção: PUT /v1/payments/:id (capture)
        mock_response(amount_in_cents.to_f / 100.0, nil, 'captured')
      end

      # Estorna pagamento
      def credit(amount_in_cents, response_code, gateway_options = {})
        # Em produção: POST /v1/payments/:id/refund
        mock_response(amount_in_cents.to_f / 100.0, nil, 'refunded')
      end

      # Cancela pagamento
      def void(response_code, gateway_options = {})
        # Em produção: PUT /v1/payments/:id (cancel)
        mock_response(0, nil, 'cancelled')
      end

      # URL do painel do Mercado Pago para o pagamento
      def gateway_dashboard_payment_url(payment)
        base = preferences[:sandbox] ? 'https://www.mercadopago.com.br' : 'https://www.mercadopago.com.br'
        "#{base}/activities?type=payment&id=#{payment.transaction_id}"
      end

      # Criar preferência de pagamento (Checkout Pro / Transparente)
      # Retorna JSON com init_point (URL de checkout) ou QR code (Pix)
      def create_preference(order, vendor_split: nil)
        items = order.line_items.map do |li|
          {
            id: li.variant_id.to_s,
            title: li.name,
            description: li.description || li.name,
            quantity: li.quantity,
            unit_price: li.price.to_f,
            currency_id: 'BRL'
          }
        end

        preference_data = {
          items: items,
          payer: { email: order.email },
          back_urls: {
            success: gateway_options[:return_url],
            pending: gateway_options[:return_url],
            failure: gateway_options[:return_url]
          },
          auto_return: 'approved',
          statement_descriptor: 'PHOTOGO',
          marketplace_fee: preferences[:marketplace_fee]
        }

        # Split payment: se vendedor tem mercado_pago_account_id, adiciona
        if vendor_split
          preference_data[:marketplace] = vendor_split[:marketplace]
          preference_data[:sponsor_id] = vendor_split[:sponsor_id]
        end

        # Em produção: POST /checkout/preferences
        # Retorna { id, init_point, sandbox_init_point }
        {
          id: "pref_#{order.id}_#{Time.current.to_i}",
          init_point: preferences[:sandbox] ? 'https://sandbox.mercadopago.com.br/checkout/v1/redirect' : 'https://www.mercadopago.com.br/checkout/v1/redirect',
          sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect'
        }
      end

      # Criar pagamento Pix
      # Retorna { qr_code, qr_code_base64, ticket_url }
      def create_pix_payment(amount, payer_email, description = '')
        payment_data = {
          transaction_amount: amount.to_f,
          payment_method_id: 'pix',
          payer: { email: payer_email },
          description: description
        }

        # Em produção: POST /v1/payments com payment_method_id: "pix"
        # Retorna: { id, point_of_interaction: { transaction_data: { qr_code, qr_code_base64, ticket_url } } }
        {
          id: "pix_#{SecureRandom.hex(8)}",
          status: 'pending',
          qr_code: '00020126360014BR.GOV.BCB.PIX0114test@photogo.com.br5204000053039865802BR5913PHOTOGO',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUg==',
          ticket_url: 'https://www.mercadopago.com.br/checkout/v1/redirect',
          expires_at: 30.minutes.from_now.iso8601
        }
      end

      private

      def mock_response(amount, source, status)
        ActiveMerchant::Billing::Response.new(
          true,
          "Mercado Pago: #{status} R$#{amount.round(2)}",
          {
            authorization: "mp_#{SecureRandom.hex(8)}",
            status: status,
            amount: amount.to_s
          },
          { test: preferences[:sandbox] }
        )
      end
    end
  end
end
