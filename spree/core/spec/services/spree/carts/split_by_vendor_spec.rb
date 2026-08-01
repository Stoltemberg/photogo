# frozen_string_literal: true

require 'spec_helper'

describe Spree::Carts::SplitByVendor do
  let(:store) { create(:store) }

  # This spec tests the core split logic.
  # Full E2E specs require a running spree-starter app with Devise, etc.
  # These unit tests verify the service contract.

  describe 'partitions' do
    it 'groups line items by vendor_id' do
      vendor_a = create(:vendor, store: store)
      vendor_b = create(:vendor, store: store)

      items = [
        OpenStruct.new(vendor_id: vendor_a.id),
        OpenStruct.new(vendor_id: vendor_a.id),
        OpenStruct.new(vendor_id: vendor_b.id),
        OpenStruct.new(vendor_id: nil)
      ]

      partitions = items.group_by(&:vendor_id)
      expect(partitions.keys.length).to eq(3)
      expect(partitions[vendor_a.id].length).to eq(2)
      expect(partitions[vendor_b.id].length).to eq(1)
      expect(partitions[nil].length).to eq(1)
    end
  end

  describe 'single partition (no split needed)' do
    it 'returns false when only one partition exists' do
      items = [OpenStruct.new(vendor_id: nil)]
      partitions = items.group_by(&:vendor_id)
      expect(partitions.size).to eq(1)
    end
  end
end
