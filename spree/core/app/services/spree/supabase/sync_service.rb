# frozen_string_literal: true

module Spree
  module Supabase
    # SyncService — sincroniza usuários e vendors do Spree com Supabase Auth.
    #
    # Funciona em duas direções:
    # 1. Spree → Supabase: ao criar/atualizar usuário/vendor no Spree, cria/atualiza no Supabase
    # 2. Supabase → Spree: webhook do Supabase (user.created/updated/deleted) atualiza Spree
    #
    # Uso:
    #   Spree::Supabase::SyncService.sync_user(user)
    #   Spree::Supabase::SyncService.sync_vendor(vendor)
    #   Spree::Supabase::SyncService.handle_webhook(payload)
    #
    class SyncService
      class << self
        # Sincroniza um Spree::User (customer) com Supabase
        def sync_user(user)
          return { error: 'Supabase not configured' } unless Spree::Supabase.admin_ready?

          data = {
            full_name: user.name,
            avatar_url: user.avatar&.url,
            phone: user.phone,
            metadata: {
              spree_user_id: user.id,
              spree_email: user.email,
              roles: user.spree_roles.pluck(:name)
            }
          }

          # Verifica se já existe no Supabase
          supabase_user = find_supabase_user_by_email(user.email)

          if supabase_user
            # Atualiza
            Spree::Supabase.update_user_metadata(supabase_user['id'], data)
            { status: 'updated', user_id: supabase_user['id'] }
          else
            # Cria
            result = Spree::Supabase.create_user(
              email: user.email,
              password: SecureRandom.hex(16), # senha temporária — user usa OAuth/password reset
              data: data
            )
            { status: 'created', user_id: result.dig('user', 'id') }
          end
        rescue StandardError => e
          Rails.logger.error "[Supabase Sync] User sync failed: #{e.message}"
          { error: e.message }
        end

        # Sincroniza um Spree::Vendor (fotógrafo) com Supabase
        def sync_vendor(vendor)
          return { error: 'Supabase not configured' } unless Spree::Supabase.admin_ready?

          user = vendor.user
          return { error: 'Vendor has no associated user' } unless user

          data = {
            full_name: vendor.name,
            avatar_url: vendor.logo&.url,
            phone: vendor.phone,
            tax_id: vendor.tax_id,
            tax_type: vendor.tax_type,
            business_name: vendor.business_name,
            metadata: {
              spree_vendor_id: vendor.id,
              spree_user_id: user.id,
              spree_email: user.email,
              vendor_status: vendor.status,
              payout_provider: vendor.payout_provider,
              mercado_pago_account_id: vendor.mercado_pago_account_id
            }
          }

          supabase_user = find_supabase_user_by_email(user.email)

          if supabase_user
            Spree::Supabase.update_user_metadata(supabase_user['id'], data)
            { status: 'updated', user_id: supabase_user['id'] }
          else
            result = Spree::Supabase.create_user(
              email: user.email,
              password: SecureRandom.hex(16),
              data: data
            )
            { status: 'created', user_id: result.dig('user', 'id') }
          end
        rescue StandardError => e
          Rails.logger.error "[Supabase Sync] Vendor sync failed: #{e.message}"
          { error: e.message }
        end

        # Processa webhook do Supabase (user.created/updated/deleted)
        def handle_webhook(payload)
          event = payload[:type] || payload['type']
          record = payload[:record] || payload['record']

          case event
          when 'user.created', 'user.updated'
            sync_from_supabase(record)
          when 'user.deleted'
            delete_from_spree(record)
          else
            { status: 'ignored', reason: "Unknown event: #{event}" }
          end
        rescue StandardError => e
          Rails.logger.error "[Supabase Sync] Webhook failed: #{e.message}"
          { error: e.message }
        end

        # Sincroniza planos/assinaturas do usuário
        def sync_subscription(user, subscription)
          return { error: 'Supabase not configured' } unless Spree::Supabase.admin_ready?

          supabase_user = find_supabase_user_by_email(user.email)
          return { error: 'User not found in Supabase' } unless supabase_user

          # Atualiza metadata com info da assinatura
          data = {
            subscription: {
              plan_slug: subscription.plan&.slug,
              status: subscription.status,
              current_period_end: subscription.current_period_end,
              external_id: subscription.external_id,
              provider: subscription.provider
            }
          }

          Spree::Supabase.update_user_metadata(supabase_user['id'], data)
          { status: 'synced' }
        rescue StandardError => e
          Rails.logger.error "[Supabase Sync] Subscription sync failed: #{e.message}"
          { error: e.message }
        end

        private

        def find_supabase_user_by_email(email)
          return nil unless Spree::Supabase.admin_ready?

          # Lista usuários (paginado) - em produção usar filtro por email
          result = Spree::Supabase.admin_client.auth.admin.list_users
          users = result.dig('users') || []
          users.find { |u| u['email'] == email }
        end

        def sync_from_supabase(record)
          # Supabase → Spree
          # Se o usuário não existe no Spree, cria
          email = record['email']
          user = Spree::User.find_by(email: email)

          if user
            # Atualiza metadata
            user.update!(
              name: record.dig('user_metadata', 'full_name') || user.name,
              phone: record.dig('user_metadata', 'phone') || user.phone
            )
            { status: 'updated', user_id: user.id }
          else
            # Cria usuário Spree
            user = Spree::User.create!(
              email: email,
              password: SecureRandom.hex(16),
              name: record.dig('user_metadata', 'full_name'),
              phone: record.dig('user_metadata', 'phone')
            )
            { status: 'created', user_id: user.id }
          end
        end

        def delete_from_supabase(record)
          # Marca usuário como deletado (soft delete) ou anonimiza
          email = record['email'] || record['user_metadata']&.dig('email')
          user = Spree::User.find_by(email: email)
          if user
            user.update!(deleted_at: Time.current, email: "deleted_#{user.id}@deleted.supabase")
            { status: 'soft_deleted', user_id: user.id }
          else
            { status: 'not_found' }
          end
        end
      end
    end
  end
end