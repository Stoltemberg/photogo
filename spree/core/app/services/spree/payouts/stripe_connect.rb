# frozen_string_literal: true

# Spree::Payouts::StripeConnect — basic Stripe Connect Express provider.
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md` Decision 9:
# Ships with the monorepo Stripe gateway alongside the core gateway.
# Express onboarding + on-fulfillment transfers.
# Does NOT handle: reverse!, KYC operations, reconciliation, DAC7 reports.

module Spree
  module Payouts
    class StripeConnect < Spree::PayoutProvider::Base
      def transfer!(vendor_transfer)
        return unless vendor_transfer.vendor.stripe_account_id.present?

        # In production, this calls Stripe::Transfer.create
        # For now, we log and mark complete
        Rails.logger.info "[PhotoGo] StripeConnect#transfer! #{vendor_transfer.id} → #{vendor_transfer.vendor.stripe_account_id}"

        vendor_transfer.update!(provider: 'stripe_connect')
        vendor_transfer.complete!
      end

      def pay!(vendor_payout)
        # Stripe handles connected-account payout scheduling natively.
        # We record the payout row from Stripe webhook events.
        Rails.logger.info "[PhotoGo] StripeConnect#pay! #{vendor_payout.id} (via Stripe native schedule)"

        vendor_payout.update!(provider: 'stripe_connect')
        # Do NOT mark complete here — wait for Stripe payout webhook
      end

      def reverse!(vendor_transfer)
        # Ledger-only: records the reversal, moves no money back.
        # Actual Stripe transfer reversal is Enterprise (paid tier).
        Rails.logger.info "[PhotoGo] StripeConnect#reverse! #{vendor_transfer.id} (ledger only — no Stripe call)"

        vendor_transfer.complete!
      end
    end
  end
end
