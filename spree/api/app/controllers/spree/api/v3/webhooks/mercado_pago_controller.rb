# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Webhooks
        # Webhook handler para notificações de pagamento do Mercado Pago.
        #
        # Mercado Pago envia POST para /api/v3/webhooks/payments/:payment_method_id
        # com body: { action: "payment.updated", data: { id: "1234567890" } }
        #
        # Fluxo:
        #   1. Mercado Pago notifica que pagamento foi aprovado
        #   2. Buscamos o pagamento na API do MP para confirmar
        #   3. Marcamos o pagamento Spree como pago
        #   4. Criamos comissões para o vendor
        #   5. Geramos delivery digital (se aplicável)
        #
        class MercadoPagoController < BaseController
          # POST /api/v3/webhooks/mercado_pago
          # Body: { action: "payment.updated", data: { id: "..." } }
          skip_before_action :authenticate_api_key!

          def create
            payload = params[:webhook] || params

            action = payload[:action]
            payment_id = payload.dig(:data, :id)

            unless action && payment_id
              return render json: { status: 'ignored', reason: 'missing action or payment_id' }, status: :ok
            end

            case action
            when 'payment.created', 'payment.updated'
              handle_payment_update(payment_id)
            when 'refund.created', 'chargeback.created'
              handle_refund(payment_id)
            else
              Rails.logger.info "[MercadoPago Webhook] Unknown action: #{action}"
            end

            render json: { status: 'ok' }, status: :ok
          rescue StandardError => e
            Rails.logger.error "[MercadoPago Webhook] Error: #{e.message}"
            render json: { status: 'error', message: e.message }, status: :ok # always 200 to MP
          end

          private

          # Processa notificação de atualização de pagamento
          def handle_payment_update(mp_payment_id)
            # Em produção: GET /v1/payments/:id no Mercado Pago
            # Para verificar o status real do pagamento
            #
            # payment = mercado_pago_api.get("/v1/payments/#{mp_payment_id}")
            # status = payment['status'] # approved, pending, rejected
            #
            # Por ora, simulamos a busca
            status = fetch_payment_status(mp_payment_id)

            case status
            when 'approved'
              # Buscar pagamento Spree pelo transaction_id
              spree_payment = Spree::Payment.find_by(transaction_id: mp_payment_id.to_s)
              return unless spree_payment

              # Marcar como pago
              spree_payment.complete! unless spree_payment.completed?

              # Marcar ordem como completa se ainda não estiver
              order = spree_payment.order
              if order.state != 'complete'
                order.update!(state: 'complete', completed_at: Time.current)
                # O concern Photo::OrderCommission criará as comissões
              end

              Rails.logger.info "[MercadoPago Webhook] Payment #{mp_payment_id} approved — order #{order.id} completed"

            when 'rejected', 'cancelled'
              spree_payment = Spree::Payment.find_by(transaction_id: mp_payment_id.to_s)
              return unless spree_payment

              spree_payment.failure!
              Rails.logger.info "[MercadoPago Webhook] Payment #{mp_payment_id} rejected"

            when 'pending'
              Rails.logger.info "[MercadoPago Webhook] Payment #{mp_payment_id} pending (waiting for Pix/Boleto)"
            end
          end

          # Processa notificação de estorno
          def handle_refund(mp_payment_id)
            spree_payment = Spree::Payment.find_by(transaction_id: mp_payment_id.to_s)
            return unless spree_payment

            # Revogar deliveries digitais
            order = spree_payment.order
            Photo::DigitalDelivery.where(order: order).each(&:revoke!)

            # Reverter comissões
            Photo::Commission.where(order: order).update_all(status: :pending)

            Rails.logger.info "[MercadoPago Webhook] Refund for payment #{mp_payment_id} — deliveries revoked"
          end

          # Simulação — em produção chama GET /v1/payments/:id na API do MP
          def fetch_payment_status(mp_payment_id)
            # mercado_pago_api = MercadoPago::API.new(access_token: ...)
            # response = mercado_pago_api.get("/v1/payments/#{mp_payment_id}")
            # response['status']
            'approved' # mock
          end

          def mercado_pago_gateway
            @mercado_pago_gateway ||= Spree::Gateway::MercadoPago.active.first
          end
        end
      end
    end
  end
end
