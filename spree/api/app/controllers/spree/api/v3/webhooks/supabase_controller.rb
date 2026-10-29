# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Webhooks
        # Webhook handler para eventos de autenticação do Supabase.
        #
        # Supabase envia POST para /api/v3/webhooks/supabase
        # com headers:
        #   - X-Supabase-Signature: HMAC-SHA256 do payload (secreto configurado)
        #
        # Eventos suportados:
        #   - user.created
        #   - user.updated
        #   - user.deleted
        #   - session.created
        #   - session.removed
        #
        class SupabaseController < BaseController
          # POST /api/v3/webhooks/supabase
          skip_before_action :authenticate_api_key!

          def create
            # Verifica assinatura se secret configurado
            if supabase_webhook_secret.present?
              signature = request.headers['X-Supabase-Signature']
              payload = request.body.read
              expected = OpenSSL::HMAC.hexdigest('SHA256', supabase_webhook_secret, payload)

              unless ActiveSupport::SecurityUtils.secure_compare(signature, expected)
                Rails.logger.warn "[Supabase Webhook] Invalid signature"
                return render json: { status: 'error', reason: 'Invalid signature' }, status: :unauthorized
              end
            end

            payload = JSON.parse(request.body.read, symbolize_names: true)

            event = payload[:type] || payload['type']
            record = payload[:record] || payload['record']

            Rails.logger.info "[Supabase Webhook] Event: #{event}"

            case event
            when 'user.created', 'user.updated'
              result = Spree::Supabase::SyncService.handle_webhook(payload)
            when 'user.deleted'
              result = Spree::Supabase::SyncService.handle_webhook(payload)
            when 'session.created', 'session.removed'
              # Opcional: track sessions for analytics
              result = { status: 'logged' }
            else
              result = { status: 'ignored', reason: "Unknown event: #{event}" }
            end

            render json: result, status: :ok
          rescue JSON::ParserError => e
            Rails.logger.error "[Supabase Webhook] Invalid JSON: #{e.message}"
            render json: { status: 'error', reason: 'Invalid JSON' }, status: :bad_request
          rescue StandardError => e
            Rails.logger.error "[Supabase Webhook] Error: #{e.message}"
            render json: { status: 'error', reason: e.message }, status: :ok
          end

          private

          def supabase_webhook_secret
            ENV['SUPABASE_WEBHOOK_SECRET']
          end
        end
      end
    end
  end
end