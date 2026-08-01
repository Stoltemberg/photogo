# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::Payout, type: :model do
  let(:vendor) { create(:vendor) }
  let(:payout) { build(:payout, vendor: vendor, amount_cents: 5000, currency: 'BRL') }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(payout).to be_valid
    end

    it 'requires amount_cents to be a non-negative integer' do
      payout.amount_cents = -1
      expect(payout).not_to be_valid
    end

    it 'requires currency' do
      payout.currency = nil
      expect(payout).not_to be_valid
    end

    it 'allows nil stripe_payout_id' do
      payout.stripe_payout_id = nil
      expect(payout).to be_valid
    end
  end

  describe 'enums' do
    it 'defaults to scheduled' do
      expect(payout.status).to eq('scheduled')
    end

    it 'supports scheduled, processing, paid, failed' do
      expect(Photo::Payout.statuses.keys).to contain_exactly('scheduled', 'processing', 'paid', 'failed')
    end
  end

  describe '#mark_processing!' do
    it 'sets status to processing and stores stripe_payout_id' do
      payout.save!
      payout.mark_processing!('po_12345')
      expect(payout.status).to eq('processing')
      expect(payout.stripe_payout_id).to eq('po_12345')
    end
  end

  describe '#mark_paid!' do
    it 'sets status to paid' do
      payout.save!
      payout.mark_paid!
      expect(payout.status).to eq('paid')
    end
  end

  describe '#mark_failed!' do
    it 'sets status to failed' do
      payout.save!
      payout.mark_failed!
      expect(payout.status).to eq('failed')
    end
  end

  describe '#money' do
    it 'returns a Money object' do
      payout.amount_cents = 5000
      expect(payout.money).to be_a(Money)
    end
  end
end
