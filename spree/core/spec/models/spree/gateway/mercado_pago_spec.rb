# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Spree::Gateway::MercadoPago, type: :model do
  let(:gateway) do
    Spree::Gateway::MercadoPago.new.tap do |g|
      g.preferred_access_token = 'TEST-12345'
      g.preferred_public_key  = 'APP_USR-67890'
      g.preferred_sandbox     = true
      g.preferred_marketplace_fee = 1500 # R$15 em centavos
    end
  end

  describe 'preferences' do
    it 'has access_token preference' do
      expect(gateway.preferred_access_token).to eq('TEST-12345')
    end

    it 'has public_key preference' do
      expect(gateway.preferred_public_key).to eq('APP_USR-67890')
    end

    it 'defaults sandbox to true' do
      expect(gateway.preferred_sandbox).to be true
    end

    it 'defaults marketplace_fee to 0' do
      fresh = Spree::Gateway::MercadoPago.new
      expect(fresh.preferred_marketplace_fee).to eq(0)
    end
  end

  describe '#api_type' do
    it 'returns "mercado_pago"' do
      expect(Spree::Gateway::MercadoPago.api_type).to eq('mercado_pago')
    end
  end

  describe '#payment_source_class' do
    it 'returns Spree::MercadoPagoSource' do
      expect(gateway.payment_source_class).to eq(Spree::MercadoPagoSource)
    end
  end

  describe '#payment_profiles_supported?' do
    it 'returns false' do
      expect(gateway.payment_profiles_supported?).to be false
    end
  end

  describe '#authorize' do
    let(:source) { Spree::MercadoPagoSource.new(payment_method_id: 'visa', token: 'card_token_123', installments: 6) }
    let(:result) { gateway.authorize(19980, source, { email: 'buyer@test.com' }) }

    it 'returns a successful response' do
      expect(result).to be_success
    end

    it 'includes status in params' do
      expect(result.params['status']).to eq('authorized')
    end
  end

  describe '#capture' do
    it 'returns a successful response' do
      result = gateway.capture(19980, 'auth_123')
      expect(result).to be_success
    end
  end

  describe '#void' do
    it 'returns a successful response' do
      result = gateway.void('auth_123')
      expect(result).to be_success
    end
  end

  describe '#gateway_dashboard_payment_url' do
    let(:payment) { double('Payment', transaction_id: '1234567890') }

    it 'returns a Mercado Pago URL' do
      url = gateway.gateway_dashboard_payment_url(payment)
      expect(url).to include('mercadopago.com.br')
      expect(url).to include('1234567890')
    end
  end

  describe '#create_pix_payment' do
    let(:result) { gateway.create_pix_payment(199.80, 'buyer@test.com', 'PhotoGo Order') }

    it 'returns a hash with QR code data' do
      expect(result[:id]).to start_with('pix_')
      expect(result[:status]).to eq('pending')
      expect(result[:qr_code]).to be_present
      expect(result[:qr_code_base64]).to be_present
      expect(result[:expires_at]).to be_present
    end
  end
end
