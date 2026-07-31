# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::Commission, type: :model do
  let(:order)   { create(:order) }
  let(:vendor)  { create(:vendor) }
  let(:commission) { build(:commission, order: order, vendor: vendor, amount_cents: 1500, currency: 'BRL') }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(commission).to be_valid
    end

    it 'requires amount_cents to be a non-negative integer' do
      commission.amount_cents = -1
      expect(commission).not_to be_valid
    end

    it 'requires currency' do
      commission.currency = nil
      expect(commission).not_to be_valid
    end
  end

  describe 'enums' do
    it 'defaults to pending' do
      expect(commission.status).to eq('pending')
    end

    it 'supports pending and paid' do
      expect(Photo::Commission.statuses.keys).to contain_exactly('pending', 'paid')
    end
  end

  describe 'scopes' do
    it 'returns pending commissions' do
      commission.save!
      expect(Photo::Commission.pending).to include(commission)
    end

    it 'returns paid commissions' do
      commission.save!
      commission.update!(status: :paid)
      expect(Photo::Commission.paid).to include(commission)
    end
  end

  describe '#mark_paid!' do
    it 'sets status to paid and stores stripe_transfer_id' do
      commission.save!
      commission.mark_paid!('tr_123456')
      expect(commission.status).to eq('paid')
      expect(commission.stripe_transfer_id).to eq('tr_123456')
    end
  end

  describe '#money' do
    it 'returns a Money object' do
      commission.amount_cents = 1500
      expect(commission.money).to be_a(Money)
      # Money.new(1500, 'BRL') => R$15.00 in BRL
    end
  end
end
