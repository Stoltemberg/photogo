# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::StripePayoutProcessor, type: :service do
  let(:vendor)  { create(:vendor) }
  let(:order)   { create(:order) }
  let!(:commission) do
    create(:commission, order: order, vendor: vendor, amount_cents: 3000, currency: 'BRL', status: :pending)
  end
  let!(:payout) do
    create(:payout, vendor: vendor, amount_cents: 3000, currency: 'BRL', status: :scheduled)
  end

  describe '.run!' do
    it 'processes scheduled payouts' do
      # Stub the StripeConnect provider to avoid real API calls
      provider = double('Spree::Payouts::StripeConnect')
      allow(Spree::Payouts::StripeConnect).to receive(:new).and_return(provider)
      allow(provider).to receive(:pay!)

      # Stub VendorPayout creation
      vendor_payout = double('Spree::VendorPayout')
      allow(Spree::VendorPayout).to receive(:find_or_initialize_by).and_return(vendor_payout)
      allow(vendor_payout).to receive(:amount_cents=)
      allow(vendor_payout).to receive(:currency=)
      allow(vendor_payout).to receive(:save!)

      result = described_class.run!

      expect(result).to be_an(Array)
      expect(result.length).to eq(1)
      expect(result.first[:vendor_id]).to eq(vendor.id)
      expect(result.first[:amount_cents]).to eq(3000)
    end

    it 'skips payouts with no pending commissions' do
      commission.update!(status: :paid)

      provider = double('Spree::Payouts::StripeConnect')
      allow(Spree::Payouts::StripeConnect).to receive(:new).and_return(provider)
      allow(provider).to receive(:pay!)

      vendor_payout = double('Spree::VendorPayout')
      allow(Spree::VendorPayout).to receive(:find_or_initialize_by).and_return(vendor_payout)
      allow(vendor_payout).to receive(:amount_cents=)
      allow(vendor_payout).to receive(:currency=)
      allow(vendor_payout).to receive(:save!)

      result = described_class.run!

      expect(result).to be_empty
    end

    it 'updates payout amount from sum of pending commissions' do
      create(:commission, order: create(:order), vendor: vendor, amount_cents: 2000, currency: 'BRL', status: :pending)

      provider = double('Spree::Payouts::StripeConnect')
      allow(Spree::Payouts::StripeConnect).to receive(:new).and_return(provider)
      allow(provider).to receive(:pay!)

      vendor_payout = double('Spree::VendorPayout')
      allow(Spree::VendorPayout).to receive(:find_or_initialize_by).and_return(vendor_payout)
      allow(vendor_payout).to receive(:amount_cents=)
      allow(vendor_payout).to receive(:currency=)
      allow(vendor_payout).to receive(:save!)

      described_class.run!

      # Total should be 3000 + 2000 = 5000
      expect(payout.reload.amount_cents).to eq(5000)
    end
  end
end
