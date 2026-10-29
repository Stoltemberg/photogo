# frozen_string_literal: true

module Spree
  # PaymentSplit — per-child-order bookkeeping of the ONE gateway payment.
  # Created at split time, one per child order, unique index on (payment_id, order_id).
  # No cloned Payment rows — gateway object stays singular.

  class PaymentSplit < Spree.base_class
    has_prefix_id :paysp

    belongs_to :payment,     class_name: 'Spree::Payment'
    belongs_to :order,       class_name: 'Spree::Order'
    belongs_to :order_group, class_name: 'Spree::OrderGroup', optional: true

    validates :payment_id, uniqueness: { scope: :order_id }
    validates :amounts_updated, numericality: { greater_than_or_equal_to: 0 }

    extend Spree::DisplayMoney
    money_methods :authorized_amount, :captured_amount, :refunded_amount

    # ──────────────── Scopes ────────────────
    scope :by_payment, ->(payment) { where(payment: payment) }
    scope :by_order, ->(order) { where(order: order) }

    # ──────────────── Methods ────────────────

    def net_exposure
      authorized_amount - refunded_amount
    end

    def fully_refunded?
      refunded_amount >= authorized_amount
    end

    # Update on capture/refund events
    def capture!(amount)
      increment!(:captured_amount, amount)
    end

    def refund!(amount)
      increment!(:refunded_amount, amount)
    end

    private

    def amounts_updated
      captured_amount + refunded_amount
    end
  end
end
