# frozen_string_literal: true

module Photo
  # A Commission links an Order to a Vendor (photographer) and records the
  # amount the platform owes to that vendor for the sale.
  #
  # The commission is calculated as:
  #   product_price * license_multiplier * platform_fee_rate
  # where `platform_fee_rate` is a constant (e.g. 0.15 = 15%).
  #
  # After Stripe Transfer succeeds, `status` becomes 'paid' and the
  # `stripe_transfer_id` is stored.
  class Commission < Spree.base_class
    has_prefix_id :comm

    belongs_to :order,  class_name: 'Spree::Order'
    belongs_to :vendor, class_name: 'Spree::Vendor'

    enum :status, { pending: 0, paid: 1 }, default: :pending, validate: true

    validates :amount_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :currency, presence: true
    validates :stripe_transfer_id, uniqueness: true, allow_nil: true

    scope :pending, -> { where(status: 'pending') }
    scope :paid,    -> { where(status: 'paid') }

    # Returns the amount in BRL as Money (requires money-rails gem)
    def money
      Money.new(amount_cents, currency)
    end

    # Mark commission as paid after a successful Stripe transfer.
    def mark_paid!(stripe_transfer_id)
      update!(status: :paid, stripe_transfer_id: stripe_transfer_id)
    end
  end
end
