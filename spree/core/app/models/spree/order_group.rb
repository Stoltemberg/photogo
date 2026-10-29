# frozen_string_literal: true

module Spree
  # OrderGroup — transaction container for N orders placed together as one
  # customer checkout. Domain-neutral: multi-vendor is its first consumer,
  # but reused for split-by-location, split-by-availability, B2B.
  #
  # Per Decision 8: OrderGroup is vendor-agnostic. `vendor` lives on child Order.

  class OrderGroup < Spree.base_class
    has_prefix_id :ogrp

    include Spree::Metadata
    publishes_lifecycle_events

    belongs_to :store,        class_name: 'Spree::Store'
    belongs_to :customer,     class_name: Spree.user_class.to_s, optional: true
    belongs_to :ship_address, class_name: 'Spree::Address', optional: true
    belongs_to :bill_address, class_name: 'Spree::Address', optional: true

    has_many :orders,          class_name: 'Spree::Order',          dependent: :restrict_with_error
    has_many :payments,        class_name: 'Spree::Payment'
    has_many :payment_splits,  class_name: 'Spree::PaymentSplit',   through: :payments
    has_many :vendor_transfers, class_name: 'Spree::VendorTransfer', through: :orders

    validates :number, presence: true, uniqueness: true
    validates :currency, presence: true

    # ──────────────── Derived Status ────────────────
    # Status is derived across child orders, never a column.

    def fulfillment_status
      statuses = orders.pluck(:shipping_state)
      return 'pending'  if statuses.empty?
      return 'fulfilled' if statuses.all? { |s| s == 'shipped' }
      return 'canceled' if statuses.all? { |s| s == 'canceled' }
      'partial'
    end

    def payment_status
      payment = payments.first
      return 'pending' unless payment
      payment.state
    end

    def total
      orders.sum(:total)
    end

    def display_total
      Spree::Money.new(total, currency: currency)
    end
  end
end
