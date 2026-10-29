# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Spree::MercadoPagoSource, type: :model do
  let(:payment_method) { Spree::PaymentMethod.create!(type: 'Spree::Gateway::MercadoPago', name: 'Mercado Pago', active: true) }

  describe 'validations' do
    it 'is valid with payment_id' do
      source = described_class.new(payment_method_id: 'pix', payment_id: 'pix_123')
      expect(source).to be_valid
    end
  end

  describe '#pix?' do
    it 'returns true for pix payment_method_id' do
      source = described_class.new(payment_method_id: 'pix')
      expect(source.pix?).to be true
    end

    it 'returns false for card payment_method_id' do
      source = described_class.new(payment_method_id: 'visa')
      expect(source.pix?).to be false
    end
  end

  describe '#credit_card?' do
    it 'returns true for visa' do
      expect(described_class.new(payment_method_id: 'visa').credit_card?).to be true
    end

    it 'returns true for mastercard' do
      expect(described_class.new(payment_method_id: 'mastercard').credit_card?).to be true
    end

    it 'returns true for elo' do
      expect(described_class.new(payment_method_id: 'elo').credit_card?).to be true
    end

    it 'returns false for pix' do
      expect(described_class.new(payment_method_id: 'pix').credit_card?).to be false
    end
  end

  describe '#boleto?' do
    it 'returns true for boleto payment_method_id' do
      expect(described_class.new(payment_method_id: 'boleto').boleto?).to be true
    end

    it 'returns false for pix' do
      expect(described_class.new(payment_method_id: 'pix').boleto?).to be false
    end
  end

  describe '#method_description' do
    it 'returns human-readable description for pix' do
      expect(described_class.new(payment_method_id: 'pix').method_description).to eq('Pix')
    end

    it 'returns human-readable description for visa' do
      expect(described_class.new(payment_method_id: 'visa').method_description).to eq('Cartão Visa')
    end

    it 'returns human-readable description for mastercard' do
      expect(described_class.new(payment_method_id: 'mastercard').method_description).to eq('Cartão Mastercard')
    end

    it 'returns human-readable description for boleto' do
      expect(described_class.new(payment_method_id: 'boleto').method_description).to eq('Boleto Bancário')
    end

    it 'returns humanized for unknown methods' do
      expect(described_class.new(payment_method_id: 'pix_qr_code').method_description).to eq('Pix qr code')
    end
  end
end
