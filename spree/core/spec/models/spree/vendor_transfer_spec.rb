# frozen_string_literal: true

require 'spec_helper'

describe Spree::VendorTransfer, type: :model do
  let(:store) { create(:store) }
  let(:vendor) { create(:vendor, store: store) }
  let(:order) { create(:order, vendor: vendor) }

  describe 'validations' do
    subject { build(:vendor_transfer, vendor: vendor, order: order) }

    it { is_expected.to validate_presence_of(:amount) }
    it { is_expected.to validate_presence_of(:currency) }
  end

  describe 'state machine' do
    let(:transfer) { create(:vendor_transfer, vendor: vendor, order: order, status: 'pending') }

    it 'starts as pending' do
      expect(transfer.status).to eq('pending')
    end

    it 'transitions to completed' do
      transfer.complete!
      expect(transfer.status).to eq('completed')
    end

    it 'transitions to failed' do
      transfer.fail!
      expect(transfer.status).to eq('failed')
    end
  end

  describe '.calculate_for' do
    let(:vendor) { create(:vendor, store: store) }
    let(:order) { create(:order, vendor: vendor, total: 100.0) }

    it 'calculates transfer amount as total minus commission' do
      create(:commission_line, order: order, vendor: vendor, amount: 20.0, tax_amount: 4.0, total: 24.0)
      amount = Spree::VendorTransfer.calculate_for(vendor_order: order)
      expect(amount).to eq(76.0)
    end

    it 'floors at zero' do
      create(:commission_line, order: order, vendor: vendor, amount: 150.0, tax_amount: 30.0, total: 180.0)
      amount = Spree::VendorTransfer.calculate_for(vendor_order: order)
      expect(amount).to eq(0.0)
    end
  end

  describe '#reversible_amount' do
    let(:transfer) { create(:vendor_transfer, vendor: vendor, order: order, amount: 100.0, status: 'completed') }

    it 'returns the original amount when no reversals' do
      expect(transfer.reversible_amount).to eq(100.0)
    end

    it 'subtracts already-reversed amount' do
      create(:vendor_transfer, vendor: vendor, order: order, amount: 40.0, status: 'completed', reversed_from: transfer)
      expect(transfer.reversible_amount).to eq(60.0)
    end

    it 'floors at zero' do
      create(:vendor_transfer, vendor: vendor, order: order, amount: 100.0, status: 'completed', reversed_from: transfer)
      expect(transfer.reversible_amount).to eq(0.0)
    end
  end
end
