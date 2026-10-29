# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Spree::Payouts::MercadoPago, type: :service do
  let(:vendor) { create(:vendor, payout_provider: 'mercado_pago', mercado_pago_account_id: 'MP-VENDOR-123') }
  let(:provider) { described_class.new }

  describe '#transfer!' do
    let(:vendor_transfer) do
      double('VendorTransfer',
        id: 'vtr_123',
        vendor: vendor,
        amount: 100.00,
        update!: true,
        complete!: true
      )
    end

    context 'when vendor has mercado_pago_account_id' do
      it 'completes the transfer' do
        expect(vendor_transfer).to receive(:update!).with(provider: 'mercado_pago')
        expect(vendor_transfer).to receive(:complete!)
        provider.transfer!(vendor_transfer)
      end

      it 'logs the transfer' do
        expect(Rails.logger).to receive(:info).with(/MercadoPago#transfer!/)
        provider.transfer!(vendor_transfer)
      end
    end

    context 'when vendor has no mercado_pago_account_id' do
      before { vendor.mercado_pago_account_id = nil }

      it 'does nothing (returns nil)' do
        expect(provider.transfer!(vendor_transfer)).to be_nil
      end
    end
  end

  describe '#pay!' do
    let(:vendor_payout) do
      double('VendorPayout',
        id: 'vpg_123',
        update!: true,
        complete!: true
      )
    end

    it 'logs and updates provider but does not complete (waits webhook)' do
      expect(vendor_payout).to receive(:update!).with(provider: 'mercado_pago')
      expect(vendor_payout).not_to receive(:complete!)
      provider.pay!(vendor_payout)
    end
  end

  describe '#reverse!' do
    let(:vendor_transfer) do
      double('VendorTransfer',
        id: 'vtr_456',
        complete!: true
      )
    end

    it 'completes the reversal (ledger only)' do
      expect(vendor_transfer).to receive(:complete!)
      provider.reverse!(vendor_transfer)
    end
  end
end
