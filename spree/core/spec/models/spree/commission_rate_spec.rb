# frozen_string_literal: true

require 'spec_helper'

describe Spree::CommissionRate, type: :model do
  let(:store) { create(:store) }

  describe 'validations' do
    subject { build(:commission_rate, store: store) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:code) }
    it { is_expected.to validate_uniqueness_of(:code).scoped_to(:store_id) }
  end

  describe 'resolution' do
    let!(:global_rate) { create(:commission_rate, store: store, value: 10, priority: 0) }
    let!(:high_priority_rate) { create(:commission_rate, store: store, value: 5, priority: 10) }

    it 'resolves the highest priority enabled rate' do
      product = create(:product, store: store)
      line_item = build(:line_item, product: product)

      resolved = Spree::CommissionRate.resolve_for(line_item: line_item)
      expect(resolved).to eq(high_priority_rate)
    end

    it 'skips disabled rates' do
      high_priority_rate.update!(enabled: false)

      product = create(:product, store: store)
      line_item = build(:line_item, product: product)

      resolved = Spree::CommissionRate.resolve_for(line_item: line_item)
      expect(resolved).to eq(global_rate)
    end
  end

  describe '#calculate_amount' do
    let(:rate) { build(:commission_rate, kind: 'percentage', value: 10) }

    it 'calculates percentage amount' do
      result = rate.calculate_amount(base_amount: 100.0, quantity: 1)
      expect(result).to eq(10.0)
    end

    it 'clamps to min_amount' do
      rate.update!(min_amount: 5.0)
      result = rate.calculate_amount(base_amount: 10.0, quantity: 1)
      expect(result).to eq(5.0)
    end
  end
end
