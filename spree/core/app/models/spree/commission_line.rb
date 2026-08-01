# frozen_string_literal: true

module Spree
  # CommissionLine — frozen snapshot line attached to order line item.
  # One per commissioned line item + one per fulfillment when include_shipping.
  # Written once at cart completion, never recomputed on read.

  class CommissionLine < Spree.base_class
    has_prefix_id :comln

    include Spree::Metadata

    belongs_to :order,          class_name: 'Spree::Order'
    belongs_to :line_item,      class_name: 'Spree::LineItem',      optional: true
    belongs_to :fulfillment,    class_name: 'Spree::Shipment',      optional: true
    belongs_to :vendor,         class_name: 'Spree::Vendor'
    belongs_to :commission_rate, class_name: 'Spree::CommissionRate', optional: true

    validates :amount, :total, :currency, presence: true
    validates :kind, inclusion: { in: %w[percentage fixed] }
    validate :exactly_one_of_line_item_or_fulfillment

    extend Spree::DisplayMoney
    money_methods :amount, :tax_amount, :total

    scope :by_order, ->(order) { where(order: order) }
    scope :by_vendor, ->(vendor) { where(vendor: vendor) }
    scope :earnings, -> { joins(:vendor_transfers).where(vendor_transfers: { kind: 'earning' }) }

    # ──────────────── Calculation ────────────────
    # Called from Spree::Commissions::CalculateLine service during split.

    def self.calculate_for(line_item:, vendor:, commission_rate: nil)
      order = line_item.order
      product = line_item.variant.product

      # Resolve rate if not explicitly provided
      commission_rate ||= CommissionRate.resolve_for(line_item: line_item)
      return nil unless commission_rate

      # Calculate base amount
      base = if commission_rate.include_tax
               # gross (item amount including VAT)
               line_item.total
             else
               # net (item amount excluding VAT) — EU default
               (line_item.total - line_item.tax_total).to_d
             end

      # Discount proportional share
      discount_share = order.adjustments.eligible.where(adjustable_type: 'Spree::Order').sum(:amount)
      if discount_share > 0 && line_item.total > 0
        base -= (discount_share * (line_item.total / order.item_total)).abs
      end

      amount = commission_rate.calculate_amount(base_amount: base, quantity: 1)

      # Commission tax rate
      commission_tax_rate = resolve_commission_tax_rate(
        vendor: vendor,
        commission_rate: commission_rate
      )
      tax_amount = (amount * commission_tax_rate / 100.0).round(2, :half_up)

      new(
        order: order,
        line_item: line_item,
        vendor: vendor,
        commission_rate: commission_rate,
        rate_snapshot: commission_rate.value.to_s,
        kind: commission_rate.kind,
        amount: amount,
        tax_amount: tax_amount,
        total: (amount + tax_amount).round(2, :half_up),
        currency: order.currency
      )
    end

    def self.calculate_fulfillment_for(fulfillment:, vendor:, commission_rate:)
      return nil unless commission_rate&.include_shipping

      order = fulfillment.order
      shipping_amount = fulfillment.cost.to_d

      amount = commission_rate.calculate_amount(base_amount: shipping_amount, quantity: 1)
      tax_amount = (amount * resolve_commission_tax_rate(vendor: vendor, commission_rate: commission_rate) / 100.0).round(2, :half_up)

      new(
        order: order,
        fulfillment: fulfillment,
        vendor: vendor,
        commission_rate: commission_rate,
        rate_snapshot: commission_rate.value.to_s,
        kind: commission_rate.kind,
        amount: amount,
        tax_amount: tax_amount,
        total: (amount + tax_amount).round(2, :half_up),
        currency: order.currency
      )
    end

    def self.resolve_commission_tax_rate(vendor:, commission_rate:)
      # 1. Explicit override on commission_rate
      return commission_rate.commission_tax_rate.to_d if commission_rate.commission_tax_rate.present?

      # 2. Store preference default (future TaxProvider integration)
      0.0
    end

    private

    def exactly_one_of_line_item_or_fulfillment
      if line_item.present? && fulfillment.present?
        errors.add(:base, 'Exactly one of line_item or fulfillment must be set')
      elsif line_item.blank? && fulfillment.blank?
        errors.add(:base, 'Exactly one of line_item or fulfillment must be set')
      end
    end
  end
end
