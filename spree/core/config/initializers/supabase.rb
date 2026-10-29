# frozen_string_literal: true

# Supabase Configuration
#
# Configure via environment variables:
#   SUPABASE_URL            - URL do projeto (ex: "https://tnrkdxssuqhcivqmpxht.supabase.co")
#   SUPABASE_ANON_KEY       - Chave pública (anon key) para uso client-side
#   SUPABASE_SERVICE_ROLE_KEY - Chave secreta (service_role) para uso server-side
#   SUPABASE_JWT_SECRET     - Segredo JWT (para validar tokens)
#
# Exemplo .env:
#   SUPABASE_URL=https://tnrkdxssuqhcivqmpxht.supabase.co
#   SUPABASE_ANON_KEY=sb_publishable_E88j2iN7EnigucV_BTfMfQ_QKtwJKLC
#   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#   SUPABASE_JWT_SECRET=your_jwt_secret

module Spree
  module Supabase
    class Configuration
      attr_accessor :url, :anon_key, :service_role_key, :jwt_secret

      def initialize
        @url              = ENV['SUPABASE_URL']
        @anon_key         = ENV['SUPABASE_ANON_KEY']
        @service_role_key = ENV['SUPABASE_SERVICE_ROLE_KEY']
        @jwt_secret       = ENV['SUPABASE_JWT_SECRET']
      end

      # Returns true if both URL and anon_key are present
      def configured?
        url.present? && anon_key.present?
      end

      # Returns true if service role key is present (for admin operations)
      def admin_configured?
        configured? && service_role_key.present?
      end
    end

    class << self
      def config
        @config ||= Configuration.new
      end

      def configure
        yield(config)
      end

      # Client para operações admin (server-side, usa service_role_key)
      def admin_client
        return @admin_client if @admin_client && @admin_client_service_key == config.service_role_key

        if config.admin_configured?
          @admin_client_service_key = config.service_role_key
          @admin_client = ::Supabase::Client.new(
            config.url,
            config.service_role_key,
            schema: 'public'
          )
        else
          @admin_client = nil
        end
        @admin_client
      end

      # Client para operações públicas (client-side, usa anon_key)
      def public_client
        return @public_client if @public_client && @public_client_anon_key == config.anon_key

        if config.configured?
          @public_client_anon_key = config.anon_key
          @public_client = ::Supabase::Client.new(
            config.url,
            config.anon_key,
            schema: 'public'
          )
        else
          @public_client = nil
        end
        @public_client
      end

      # Cliente GoTrue para autenticação
      def auth_client
        return @auth_client if @auth_client && @auth_client_jwt_secret == config.jwt_secret

        if config.jwt_secret.present?
          @auth_client_jwt_secret = config.jwt_secret
          @auth_client = ::GoTrue::Client.new(
            config.url + '/auth/v1',
            config.jwt_secret
          )
        else
          @auth_client = nil
        end
        @auth_client
      end

      # Verifica se está configurado
      def ready?
        config.configured?
      end

      # Verifica se admin está configurado
      def admin_ready?
        config.admin_configured?
      end

      # Reseta clients
      def reset!
        @admin_client = nil
        @public_client = nil
        @auth_client = nil
        @admin_client_service_key = nil
        @public_client_anon_key = nil
        @auth_client_jwt_secret = nil
      end

      # Helper para criar usuário no Supabase
      def create_user(email:, password:, data: {})
        return { error: 'Supabase not configured' } unless admin_ready?

        admin_client.auth.admin.create_user(
          email: email,
          password: password,
          email_confirm: true,
          data: data
        )
      end

      # Helper para buscar usuário por email
      def find_user_by_email(email)
        return { error: 'Supabase not configured' } unless admin_ready?

        admin_client.auth.admin.list_users
      end

      # Helper para atualizar metadados do usuário
      def update_user_metadata(user_id, data)
        return { error: 'Supabase not configured' } unless admin_ready?

        admin_client.auth.admin.update_user(user_id, data: data)
      end

      # Helper para deletar usuário
      def delete_user(user_id)
        return { error: 'Supabase not configured' } unless admin_ready?

        admin_client.auth.admin.delete_user(user_id)
      end
    end
  end
end

# Aplica configuração ao boot
Rails.application.config.to_prepare do
  if Spree::Supabase.ready?
    Rails.logger.info "[Supabase] Configured: #{Spree::Supabase.config.url}"
  else
    Rails.logger.warn "[Supabase] Not configured — missing SUPABASE_URL or SUPABASE_ANON_KEY"
  end
end