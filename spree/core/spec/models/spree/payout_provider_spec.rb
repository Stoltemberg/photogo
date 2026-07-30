# frozen_string_literal: true

require 'spec_helper'

describe Spree::PayoutProvider::System do
  describe '#transfer!' do
    let(:vendor) { create(:vendor) }
    let(:order) { create(:order, vendor: vendor) }
    let(:transfer) { create(:vendor_transfer, vendor: vendor, order: order, status: 'pending') }

    it 'marks the transfer as completed' do
      described_class.new.transfer!(transfer)
      expect(transfer.reload.status).to eq('completed')
    end
  end

  describe '#reverse!' do
    let(:vendor) { create(:vendor) }
    let(:order) { create(:order, vendor: vendor) }
    let(:transfer) { create(:vendor_transfer, vendor: vendor, order: order, amount: 50.0, kind: 'refund_reversal', status: 'pending') }

    it 'marks the reversal as completed' do
      described_class.new.reverse!(transfer)
      expect(transfer.reload.status).to eq('completed')
    end
  end
end
