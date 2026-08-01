# frozen_string_literal: true

module Photo
  # Extends Spree::Order with a hook that creates commission records for each
  # photographer (vendor) involved in a paid order.
  #
  # The platform fee is hard‑coded at 15% of the line item total for the sake of
  # this MVP. Adjust `PLATFORM_FEE_RATE` as needed.
  #
  # The hook runs after the order state transitions to `complete` – the moment the
  # payment has succeeded and the order is finalised.
  module OrderCommission
    extend ActiveSupport::Concern

    PLATFORM_FEE_RATE = 0.15 # 15 % of the gross line‑item amount

    included do
      # Trigger after the state column has changed to 'complete'.
      after_save :create_commissions_if_completed, if: :saved_change_to_state?
    end

    private

    def create_commissions_if_completed
      return unless state == 'complete'

      # Group line items by vendor (photographer). We resolve the vendor via the
      # product's vendor association. If a line item has no vendor, we skip it.
      items_by_vendor = line_items.each_with_object(Hash.new { |h, k| h[k] = [] }) do |li|
        vendor = li.variant&.product&.vendor
        next unless vendor
        h = items_by_vendor[vendor]
        h << li
      end

      items_by_vendor.each do |vendor, items|
        # Sum gross amount for this vendor (price * quantity). All amounts are in
        # the order's currency and stored as Money objects (cents). We convert to
        # integer cents for the commission.
        gross_cents = items.sum { |li| (li.price * li.quantity).cents }
        commission_cents = (gross_cents * PLATFORM_FEE_RATE).round

        Photo::Commission.create!(
          order:          self,
          vendor:         vendor,
          amount_cents:   commission_cents,
          currency:       currency,
          status:         :pending
        )

        # Ensure a payout record exists (or update the scheduled amount).
        payout = Photo::Payout.find_or_initialize_by(vendor: vendor, status: :scheduled)
        payout.amount_cents = (payout.amount_cents || 0) + commission_cents
        payout.currency = currency
        payout.save!
      end
    end
  end
end
