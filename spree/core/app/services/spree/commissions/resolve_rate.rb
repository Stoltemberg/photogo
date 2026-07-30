# frozen_string_literal: true

# Spree::Commissions::ResolveRate — resolves the applicable commission rate
# for a given line item using the rule engine (priority-ordered, first-match-wins).
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md`:
# Rate resolution walks enabled rates by priority DESC, first match wins.
# Currency gate only applies to fixed rates.
# A rate with no rules is the global default.

module Spree
  module Commissions
    class ResolveRate
      attr_reader :line_item

      def initialize(line_item:)
        @line_item = line_item
      end

      def call
        order = line_item.order
        product = line_item.variant.product
        vendor = product&.vendor
        store = order.store

        Spree::CommissionRate
          .enabled
          .for_store(store)
          .by_priority
          .find { |rate| rate.matches?(line_item: line_item, vendor: vendor, order: order) }
      end
    end
  end
end
