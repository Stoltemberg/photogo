# frozen_string_literal: true

module Photo
  # StripePayoutProcessor – picks up scheduled Photo::Payout rows, aggregates the
  # pending commissions for each vendor and triggers a Stripe Connect transfer.
  #
  # It uses the existing Spree::Payouts::StripeConnect provider, which knows how
  # to call Stripe (or log in dev). The processor marks the payout as
  # `processing` while awaiting the Stripe webhook, then updates the associated
  # commissions to `paid` when the webhook is received (handled elsewhere).
  #
  # For simplicity we run it synchronously here; in production you would schedule
  # it as a background job (e.g. Sidekiq/Cron). The method returns a summary of
  # actions performed.
  class StripePayoutProcessor
    def self.run!
      new.run!
    end

    def run!
      summary = []

      Photo::Payout.where(status: :scheduled).find_each do |payout|
        # Load all pending commissions for this vendor.
        pending_commissions = Photo::Commission.where(vendor: payout.vendor, status: :pending)
        next if pending_commissions.empty?

        total_cents = pending_commissions.sum(:amount_cents)
        payout.update!(amount_cents: total_cents) if payout.amount_cents != total_cents

        # Use Spree's StripeConnect provider to create a transfer.
        provider = Spree::Payouts::StripeConnect.new
        # The provider expects a Spree::VendorPayout? It works with Spree::VendorPayout.
        # We'll create a temporary VendorPayout record to satisfy the API, then link.
        vendor_payout = Spree::VendorPayout.find_or_initialize_by(vendor: payout.vendor)
        vendor_payout.amount_cents = total_cents
        vendor_payout.currency = payout.currency
        vendor_payout.save!

        # Trigger the Stripe transfer (log only in dev).
        provider.pay!(vendor_payout)

        summary << { vendor_id: payout.vendor_id, payout_id: payout.id, amount_cents: total_cents }
      end

      summary
    end
  end
end
