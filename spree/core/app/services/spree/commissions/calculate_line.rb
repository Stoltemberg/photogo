# frozen_string_literal: true

# Spree::Commissions::CalculateLine — calculates a single CommissionLine
# for a line item or fulfillment, using the resolved rate.
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md` Decision 3:
# Commission is a taxable B2B service. amount + tax_amount = total.
# EU default: base on net (ex-VAT) item price, tax on top of commission.

module Spree
  module Commissions
    class CalculateLine
      attr_reader :line_item, :vendor, :fulfillment

      def initialize(line_item: nil, fulfillment: nil, vendor:)
        raise ArgumentError, 'Provide exactly one of line_item or fulfillment' if line_item.nil? && fulfillment.nil?
        raise ArgumentError, 'Cannot provide both line_item and fulfillment' if line_item.present? && fulfillment.present?

        @line_item = line_item
        @fulfillment = fulfillment
        @vendor = vendor
      end

      def call
        order = fulfillment&.order || line_item.order
        rate = Spree::CommissionRate.resolve_for(line_item: line_item)
        return nil unless rate

        amount = calculate_amount(order, rate)
        tax_rate = resolve_commission_tax_rate(rate)
        tax_amount = (amount * tax_rate / 100.0).round(2, :half_up)
        total = (amount + tax_amount).round(2, :half_up)

        Spree::CommissionLine.new(
          order: order,
          line_item: line_item,
          fulfillment: fulfillment,
          vendor: vendor,
          commission_rate: rate,
          rate_snapshot: rate.value.to_s,
          kind: rate.kind,
          amount: amount,
          tax_amount: tax_amount,
          total: total,
          currency: order.currency
        )
      end

      private

      def calculate_amount(order, rate)
        if fulfillment
          # Commission on delivery amount
          base = fulfillment.cost.to_d
        else
          # Commission on item amount
          base = rate.include_tax ? line_item.total : (line_item.total - line_item.tax_total).to_d
        end

        rate.calculate_amount(base_amount: base, quantity: 1)
      end

      def resolve_commission_tax_rate(rate)
        rate.commission_tax_rate.to_d if rate.commission_tax_rate.present?
        0.0
      end
    end
  end
end
