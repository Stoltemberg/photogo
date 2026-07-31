# frozen_string_literal: true

# Mercado Pago Configuration
#
# Configure via environment variables:
#   MERCADO_PAGO_ACCESS_TOKEN - Access token da aplicação (ex: "APP_USR-12345...")
#   MERCADO_PAGO_PUBLIC_KEY   - Chave pública da aplicação (ex: "APP_USR-67890...")
#   MERCADO_PAGO_SANDBOX      - "true" ou "false" (default: true para dev)
#   MERCADO_PAGO_APPLICATION_ID - ID do marketplace no MP (para split payment)
#   MERCADO_PAGO_MARKETPLACE_FEE - Taxa da plataforma em centavos (ex: 1500 = 15%)
#
# Exemplo .env:
#   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890...
#   MERCADO_PAGO_PUBLIC_KEY=APP_USR-0987654321...
#   MERCADO_PAGO_SANDBOX=true
#   MERCADO_PAGO_APPLICATION_ID=1234567890
#   MERCADO_PAGO_MARKETPLACE_FEE=1500

module Spree
  module MercadoPago
    class Configuration
      attr_accessor :access_token, :public_key, :sandbox, :application_id, :marketplace_fee

      def initialize
        @access_token      = ENV['MERCADO_PAGO_ACCESS_TOKEN']
        @public_key        = ENV['MERCADO_PAGO_PUBLIC_KEY']
        @sandbox           = ENV.fetch('MERCADO_PAGO_SANDBOX', 'true') == 'true'
        @application_id    = ENV['MERCADO_PAGO_APPLICATION_ID']
        @marketplace_fee   = ENV.fetch('MERCADO_PAGO_MARKETPLACE_FEE', '1500').to_i
      end

      # Returns true if both required credentials are present
      def configured?
        access_token.present? && public_key.present?
      end

      # Base URL for API calls
      def base_url
        sandbox ? 'https://api.mercadopago.com' : 'https://api.mercadopago.com'
      end

      # Checkout Pro URL for redirect
      def checkout_url
        sandbox ? 'https://sandbox.mercadopago.com.br/checkout/v1/redirect' : 'https://www.mercadopago.com.br/checkout/v1/redirect'
      end
    end

    class << self
      def config
        @config ||= Configuration.new
      end

      def configure
        yield(config)
      end

      # Instancia o SDK do Mercado Pago
      def sdk
        return @sdk if @sdk && @sdk_access_token == config.access_token

        if config.configured?
          @sdk_access_token = config.access_token
          @sdk = ::Mercadopago::SDK.new(config.access_token)
          @sdk.sandbox_mode(config.sandbox)
        else
          @sdk = nil
        end
        @sdk
      end

      # Verifica se está configurado
      def ready?
        config.configured?
      end

      # Reseta o SDK (útil para testes ou mudança de credenciais)
      def reset!
        @sdk = nil
        @sdk_access_token = nil
      end
    end
  end
end

# Aplica configuração nos gateways ativos ao boot
Rails.application.config.to_prepare do
  Spree::Gateway::MercadoPago.active.each do |gateway|
    gateway.update!(
      preferred_access_token:    Spree::MercadoPago.config.access_token,
      preferred_public_key:      Spree::MercadoPago.config.public_key,
      preferred_sandbox:         Spree::MercadoPago.config.sandbox,
      preferred_marketplace_fee: Spree::MercadoPago.config.marketplace_fee,
      preferred_application_id:  Spree::MercadoPago.config.application_id
    )
  end
end