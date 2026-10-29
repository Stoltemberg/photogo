# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::PayoutProcessor, type: :service do
  let(:vendor_stripe)    { create(:vendor, payout_provider: 'stripe_connect', stripe_account_id: 'acct_123') }
  let(:vendor_mp)        { create(:vendor, payout_provider: 'mercado_pago', mercado_pago_account_id: 'MP-VENDOR-123') }
  let(:vendor_system)    { create(:vendor, payout_provider: 'system') }
  let(:order)            { create(:order) }

  let!(:commission_stripe) do
    create(:commission, order: order, vendor: vendor_stripe, amount_cents: 3000, currency: 'BRL', status: :pending)
  end
  let!(:commission_mp) do
    create(:commission, order: order, vendor: vendor_mp, amount_cents: 5000, currency: 'BRL', status: :pending)
  end

  let!(:payout_stripe) do
    create(:payout, vendor: vendor_stripe, amount_cents: 3000, currency: 'BRL', status: :scheduled)
  end
  let!(:payout_mp) do
    create(:payout, vendor: vendor_mp, amount_cents: 5000, currency: 'BRL', status: :scheduled)
  end

  describe '.run!' do
    it 'processes payouts for vendors with stripe_connect provider' do
      stripe_provider = double('Spree::Payouts::StripeConnect')
      allow(Spree::Payouts::StripeConnect).to receive(:new).and_return(stripe_provider)
      allow(stripe_provider).to receive(:pay!)

      vendor_payout = double('Spree::VendorPayout')
      allow(Spree::VendorPayout).to receive(:find_or_initialize_by).and_return(vendor_payout)
      allow(vendor_payout).to receive(:amount_cents=)
      allow(vendor_payout).to receive(:currency=)
      allow(vendor_payout).to receive(:save!)

      result = described_class.run!

      stripe_entry = result.find { |r| r[:provider] == 'stripe_connect' }
      expect(stripe_entry).to be_present
      expect(stripe_entry[:amount_cents]).to eq(3000)
    end

    it 'processes payouts for vendors with mercado_pago provider' do
      mp_provider = double('Spree::Payouts::MercadoPago')
      allow(Spree::Payouts::MercadoPago).to receive(:new).and_return(mp_provider)
      allow(mp_provider).to receive(:pay!)

      vendor_payout = double('Spree::VendorPayout')
      allow(Spree::VendorPayout).to receive(:find_or_initialize_by).and_return(vendor_payout)
      allow(vendor_payout).to receive(:amount_cents=)
      allow(vendor_payout).to receive(:currency=)
      allow(vendor_payout).to receive(:save!)

      result = described_class.run!

      mp_entry = result.find { |r| r[:provider] == 'mercado_pago' }
      expect(mp_entry).to be_present
      expect(mp_entry[:amount_cents]).to eq(5000)
    end

    it 'skips payouts with no pending commissions' do
      commission_stripe.update!(status: :paid)
      commission_mp.update!(status: :paid)

      result = described_class.run!
      expect(result).to be_empty
    end
  end

  describe 'PROVIDER_MAP' do
    it 'maps stripe_connect to Spree::Payouts::StripeConnect' do
      expect(Photo::PayoutProcessor::PROVIDER_MAP['stripe_connect']).to eq(Spree::Payouts::StripeConnect)
    end

    it 'maps mercado_pago to Spree::Payouts::MercadoPago' do
      expect(Photo::PayoutProcessor::PROVIDER_MAP['mercado_pago']).to eq(Spree::Payouts::MercadoPago)
    end

    it 'maps system to Spree::Payouts::System' do
      expect(Photo::PayoutProcessor::PROVIDER_MAP['system']).to eq(Spree::Payouts::System)
    end

    it 'falls back to System for unknown providers' do
      payout = create(:payout, vendor: vendor_system, amount_cents: 1000, status: :scheduled)
      create(:commission, order: create(:order), vendor: vendor_system, amount_cents: 1000, status: :pending)

      system_provider = double('Spree::Payouts::System')
      allow(Spree::Payouts::System).to receive(:new).and_return(system_provider)
      allow(system_provider).to receive(:pay!)

      vendor_payout = double('Spree::VendorPayout')
      allow(Spree::VendorPayout).to receive(:find_or_initialize_by).and_return(vendor_payout)
      allow(vendor_payout).to receive(:amount_cents=)
      allow(vendor_payout).to receive(:currency=)
      allow(vendor_payout).to receive(:save!)

      result = described_class.run!
      system_entry = result.find { |r| r[:provider] == 'system' }
      expect(system_entry).to be_present
    end
  end
end
