# frozen_string_literal: true

require 'spec_helper'

describe Spree::OrderGroup, type: :model do
  let(:store) { create(:store) }

  describe 'validations' do
    subject { build(:order_group, store: store) }

    it { is_expected.to validate_presence_of(:number) }
    it { is_expected.to validate_uniqueness_of(:number) }
    it { is_expected.to validate_presence_of(:currency) }
  end

  describe 'associations' do
    subject { create(:order_group, store: store) }

    it { is_expected.to belong_to(:store).class_name('Spree::Store') }
    it { is_expected.to have_many(:orders).class_name('Spree::Order') }
    it { is_expected.to have_many(:payments).class_name('Spree::Payment') }
  end

  describe '#fulfillment_status' do
    let(:order_group) { create(:order_group, store: store) }

    it 'returns pending when no orders' do
      expect(order_group.fulfillment_status).to eq('pending')
    end

    it 'returns fulfilled when all orders shipped' do
      order = create(:order, order_group: order_group, shipping_state: 'shipped')
      expect(order_group.fulfillment_status).to eq('fulfilled')
    end

    it 'returns partial when some orders shipped' do
      create(:order, order_group: order_group, shipping_state: 'shipped')
      create(:order, order_group: order_group, shipping_state: 'pending')
      expect(order_group.fulfillment_status).to eq('partial')
    end
  end

  describe '#payment_status' do
    let(:order_group) { create(:order_group, store: store) }

    it 'returns pending when no payments' do
      expect(order_group.payment_status).to eq('pending')
    end
  end

  describe '#total' do
    let(:order_group) { create(:order_group, store: store) }

    it 'sums order totals' do
      create(:order, order_group: order_group, total: 100.0)
      create(:order, order_group: order_group, total: 50.0)
      expect(order_group.total).to eq(150.0)
    end
  end
end
