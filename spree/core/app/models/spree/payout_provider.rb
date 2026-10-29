# frozen_string_literal: true

# Spree::PayoutProvider — pluggable execution strategy for the fund ledger.
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md` Decision 9:
# Two verbs — transfer! (Level 1, on-fulfillment) and pay! (Level 2, scheduled).
# Core ships Base + System (no-op, manual settlement).
# StripeConnect ships basic Express onboarding + on-fulfillment transfers.
#
# Mirrors 6.0-tax-provider.md / 6.0-delivery-rate-provider.md pattern.

module Spree
  class PayoutProvider
    # Base class — every provider must implement these three methods.
    class Base
      # On-fulfillment: create a real money movement for the vendor's earning.
      # @param vendor_transfer [Spree::VendorTransfer] the transfer to execute
      # @raise [NotImplementedError] unless overridden
      def transfer!(vendor_transfer)
        raise NotImplementedError, "#{self.class} must implement #transfer!"
      end

      # On-interval: settle accumulated transfers into one bank payout.
      # @param vendor_payout [Spree::VendorPayout] the payout to execute
      # @raise [NotImplementedError] unless overridden
      def pay!(vendor_payout)
        raise NotImplementedError, "#{self.class} must implement #pay!"
      end

      # Refund reversal: reverse a previously-completed transfer.
      # @param vendor_transfer [Spree::VendorTransfer] the reversal transfer
      # @raise [NotImplementedError] unless overridden
      def reverse!(vendor_transfer)
        raise NotImplementedError, "#{self.class} must implement #reverse!"
      end
    end

    # Core default — records both ledgers, moves no money.
    # The OSS operator sees per-vendor balance and itemized payout records,
    # then settles offline (bank transfer/PIX) and marks payout complete.
    class System < Base
      def transfer!(vendor_transfer)
        vendor_transfer.complete!
      end

      def pay!(vendor_payout)
        # no-op — admin marks complete manually after settling offline
      end

      def reverse!(vendor_transfer)
        vendor_transfer.complete!
      end
    end
  end
end
