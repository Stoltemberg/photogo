# frozen_string_literal: true

# Migration: add vendor_id to the 6 tables the marketplace split keys off
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md` "Columns added to existing
# tables". All vendor_id columns are nullable — first-party products have nil
# (their own partition). `line_item.vendor_id` is denormalized from
# `variant.product.vendor` at add-to-cart time, revalidated at cart completion.
#
# `spree_orders.order_group_id` links child orders to their transaction container.
# `spree_payments.order_group_id` carries the single shared gateway payment.
# `spree_delivery_methods.vendor_id` scopes per-vendor shipping options.

class AddVendorColumnsToSpreeTables < ActiveRecord::Migration[7.2]
  def change
    add_reference :spree_products,        :vendor,        foreign_key: { to_table: :spree_vendors },        index: true
    add_reference :spree_stock_locations, :vendor,       foreign_key: { to_table: :spree_vendors },        index: true
    add_reference :spree_orders,          :vendor,       foreign_key: { to_table: :spree_vendors },        index: true
    add_reference :spree_orders,          :order_group,  foreign_key: { to_table: :spree_order_groups },   index: true
    add_reference :spree_line_items,      :vendor,       foreign_key: { to_table: :spree_vendors },        index: true
    add_reference :spree_payments,        :order_group,  foreign_key: { to_table: :spree_order_groups },   index: true

    # Spree::DeliveryMethod may not exist yet in 5.6.1 — it's planned for 6.0
    # under `6.0-fulfillment-and-delivery.md` (renaming ShippingMethod).
    # We add the column to spree_shipping_methods for now (legacy name in 5.6).
    add_reference :spree_shipping_methods, :vendor,       foreign_key: { to_table: :spree_vendors },        index: true
  end
end
