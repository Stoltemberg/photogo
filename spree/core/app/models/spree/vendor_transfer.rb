# frozen_string_literal: true

module Spree
  # VendorTransfer — Level 1 of the fund ledger.
  # Per-order, on-fulfillment. Credits the vendor's balance with earnings.
  # One `earning` transfer per fulfilled vendor order (partial unique index).
  # One `refund_reversal` per refunded order, linked via reversed_from.

  class VendorTransfer < Spree.base_class
    has_prefix_id :vtr

    include Spree::RansackableAttributes

    belongs_to :vendor,        class_name: 'Spree::Vendor'
    belongs_to :order,         class_name: 'Spree::Order'
    belongs_to :payout,        class_name: 'Spree::VendorPayout', optional: true
    belongs_to :reversed_from, class_name: 'Spree::VendorTransfer', optional: true

    has_many :reversals, class_name: 'Spree::VendorTransfer', foreign_key: :reversed_from_id

    state_machine :status, initial: :pending do
      event(:process)  { transition pending: :processing }
      event(:complete) { transition [:pending, :processing] => :completed }
      event(:fail)     { transition [:pending, :processing] => :failed }
    end

    validates :amount, :currency, presence: true
    validates :kind, inclusion: { in: %w[earning refund_reversal] }
    validates :provider, inclusion: { in: %w[system stripe_connect] }

    scope :completed,  -> { where(status: 'completed') }
    scope :unsettled,  -> { completed.where(payout_id: nil) }
    scope :by_vendor,  ->(vendor) { where(vendor: vendor) }
    scope :by_currency, ->(currency) { where(currency: currency) }
    scope :earnings,   -> { where(kind: 'earning') }
    scope :reversals,  -> { where(kind: 'refund_reversal') }

    extend Spree::DisplayMoney
    money_methods :amount

    # Original minus already-reversed, floored at zero (ports legacy rule).
    def reversible_amount
      base = amount
      already_reversed = reversals.completed.sum(:amount)
      [base - already_reversed, 0].max
    end

    # Transfer amount: vendor_order.total − commission_lines.sum(:total)
    def self.calculate_for(vendor_order:)
      commission_total = vendor_order.commission_lines.sum(:total)
      amount = vendor_order.total - commission_total
      [amount, 0].max
    end
  end
end
