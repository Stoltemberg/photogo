# frozen_string_literal: true

# Spree::VendorConcern — module that hooks into core models when defined.
#
# The core already checks `if defined?(Spree::VendorConcern)` in 7 models:
#   Product, Order, Shipment, StockLocation, ShippingMethod, Report, Export
#
# When included, it adds:
#   - belongs_to :vendor (nullable for first-party items)
#   - vendor-scoping scopes (for ability tenancy)
#   - write-stamp vendor_id on new records
#
# This concern is loaded by the engine, making it available globally.

module Spree
  module VendorConcern
    extend ActiveSupport::Concern

    included do
      belongs_to :vendor, class_name: 'Spree::Vendor', optional: true

      scope :for_vendor, ->(vendor) { where(vendor: vendor) }
      scope :for_vendor_id, ->(vendor_id) { where(vendor_id: vendor_id) }
      scope :first_party, -> { where(vendor_id: nil) }
    end

    # Stamp vendor_id on new records if not already set.
    # Called from controllers/services when a vendor user creates a resource.
    def stamp_vendor!(vendor)
      update!(vendor: vendor)
    end

    def first_party?
      vendor_id.nil?
    end

    def vendor_owned?
      vendor_id.present?
    end
  end
end
