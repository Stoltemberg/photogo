# frozen_string_literal: true

module Photo
  # A Payout aggregates a batch of commissions for a Vendor and creates a
  # Stripe Connect payout (or transfer) to send money to the vendor's account.
  #
  # In the typical flow:
  #   1. The platform schedules a payout (status: scheduled) – usually nightly.
  #   2. StripePayoutProcessor picks up pending payouts, creates a Stripe Transfer
  #      (or Payout) for the total amount, updates the status to 'processing'.
  #   3. When Stripe confirms, status becomes 'paid'.
  #   4. If Stripe returns an error, status => 'failed' and details are logged.
  class Payout < Spree.base_class
    has_prefix_id :payout

    belongs_to :vendor, class_name: 'Spree::Vendor'
    has_many   :commissions, class_name: 'Photo::Commission', foreign_key: :vendor_id, primary_key: :vendor_id

    enum :status, { scheduled: 0, processing: 1, paid: 2, failed: 3 }, default: :scheduled, validate: true

    validates :amount_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :currency, presence: true
    validates :stripe_payout_id, uniqueness: true, allow_nil: true

    # Money helper (requires money-rails gem)
    def money
      Money.new(amount_cents, currency)
    end

    # Mark payout as processing – stores Stripe payout id.
    def mark_processing!(stripe_id)
      update!(status: :processing, stripe_payout_id: stripe_id)
    end

    # Mark payout as successfully paid.
    def mark_paid!
      update!(status: :paid)
    end

    # Mark payout as failed – keep stripe_payout_id for reference.
    def mark_failed!
      update!(status: :failed)
    end
  end
end
