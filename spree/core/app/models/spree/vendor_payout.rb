# frozen_string_literal: true

module Spree
  # VendorPayout — Level 2 of the fund ledger.
  # Per-interval, scheduled. Sweeps vendor's accumulated unpaid transfers
  # into one bank settlement and debits the balance.
  # One payout per interval per vendor per currency.

  class VendorPayout < Spree.base_class
    has_prefix_id :vpo

    include Spree::RansackableAttributes

    belongs_to :vendor, class_name: 'Spree::Vendor'
    has_many   :transfers, class_name: 'Spree::VendorTransfer'

    state_machine :status, initial: :pending do
      event(:process)  { transition pending: :processing }
      event(:complete) { transition [:pending, :processing] => :completed }
      event(:fail)     { transition [:pending, :processing] => :failed }
    end

    validates :amount, :currency, presence: true

    scope :owed,      -> { where(status: %w[pending processing]) }
    scope :completed, -> { where(status: 'completed') }
    scope :by_vendor, ->(vendor) { where(vendor: vendor) }
    scope :by_currency, ->(currency) { where(currency: currency) }

    extend Spree::DisplayMoney
    money_methods :amount

    # Assemble payout from unsettled transfers
    def self.assemble!(vendor:, currency: 'BRL')
      unsettled = VendorTransfer.completed
        .where(vendor: vendor, currency: currency, payout_id: nil)
        .to_a

      return nil if unsettled.empty?

      payout = create!(
        vendor: vendor,
        amount: unsettled.sum(&:amount),
        currency: currency,
        period_start: unsettled.map(&:created_at).min,
        period_end: unsettled.map(&:created_at).max,
        provider: vendor.payout_provider || 'system'
      )

      # Stamp transfers with payout_id — this is the claim (single transaction)
      unsettled.each { |t| t.update_column(:payout_id, payout.id) }

      payout
    end
  end
end
