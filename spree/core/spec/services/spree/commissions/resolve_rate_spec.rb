# frozen_string_literal: true

require 'spec_helper'

describe Spree::Commissions::ResolveRate do
  let(:store) { create(:store) }

  describe 'rate resolution' do
    let!(:global_rate) { create(:commission_rate, store: store, value: 10, priority: 0) }
    let!(:high_priority_rate) { create(:commission_rate, store: store, value: 5, priority: 10) }

    it 'resolves the highest priority rate for a line item' do
      product = create(:product, store: store)
      line_item = build(:line_item, product: product)

      resolver = described_class.new(line_item: line_item)
      resolved = resolver.call
      expect(resolved).to eq(high_priority_rate)
    end

    it 'returns nil when no rates exist' do
      Spree::CommissionRate.destroy_all

      product = create(:product, store: store)
      line_item = build(:line_item, product: product)

      resolver = described_class.new(line_item: line_item)
      resolved = resolver.call
      expect(resolved).to be_nil
    end
  end
end
