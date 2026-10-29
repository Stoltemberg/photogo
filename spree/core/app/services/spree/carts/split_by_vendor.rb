# frozen_string_literal: true

# Spree::Carts::SplitByVendor — splits a completed cart into N child orders
# grouped by vendor, wrapped in a Spree::OrderGroup.
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md`:
# - Explicit call inside Spree::Carts::Complete, after payment authorization
# - Gate: only when ≥ 2 partitions exist (more than one vendor)
# - Single-partition carts complete as a bare order (no group, no PaymentSplit)
# - Partition key: line_item.vendor_id (denormalized from product.vendor)
# - Line items, their tax lines/discounts/fees, fulfillment items are
#   moved to the correct child Order
#
# This service is designed to be called from within the existing
# Spree::Carts::Complete service (via `run` call).

module Spree
  module Carts
    class SplitByVendor
      include Spree::Core::Services::Result

      attr_reader :cart, :order_group, :child_orders

      def initialize(cart:, order:)
        @cart = cart
        @order = order
        @child_orders = []
      end

      # Execute the split. Returns Result::Success with the OrderGroup
      # or Result::Failure if something goes wrong.
      def call
        return failure('Cart is not completed') unless cart.completed?
        return success(@order) unless should_split?

        ActiveRecord::Base.transaction do
          create_order_group!
          create_child_orders!
          move_line_items_to_children!
          move_adjustments_to_children!
          create_payment_splits!
          compute_children_totals!
        end

        success(order_group)
      end

      private

      def should_split?
        partitions.size > 1
      end

      # Partition line items by vendor_id.
      # First-party items (vendor_id: nil) form their own partition.
      def partitions
        @partitions ||= cart.line_items.group_by(&:vendor_id)
      end

      def create_order_group!
        @order_group = Spree::OrderGroup.create!(
          store: cart.store,
          customer: cart.user,
          email: cart.email,
          currency: cart.currency,
          number: generate_order_group_number,
          ship_address: cart.ship_address,
          bill_address: cart.bill_address
        )
      end

      def create_child_orders!
        partitions.each do |vendor_id, items|
          child_order = Spree::Order.new(
            store: cart.store,
            customer: cart.user,
            email: cart.email,
            currency: cart.currency,
            vendor_id: vendor_id,
            order_group: order_group,
            bill_address: items.first.order&.bill_address&.dup,
            ship_address: items.first.order&.ship_address&.dup
          )
          child_order.save!
          @child_orders << child_order
        end
      end

      def move_line_items_to_children!
        partitions.each_with_index do |(vendor_id, items), index|
          child_order = child_orders[index]

          items.each do |item|
            # Move line item to child order
            item.update!(
              order: child_order,
              vendor_id: vendor_id
            )

            # Move associated adjustments (tax lines, discounts, fees)
            item.adjustments.update_all(adjustable_id: child_order.id)

            # Move inventory units
            if item.inventory_units.any?
              item.inventory_units.update_all(order_id: child_order.id)
            end

            # Move shipment items
            item.shipment_items.each do |shipment_item|
              shipment_item.update!(order_id: child_order.id)
            end
          end
        end
      end

      def move_adjustments_to_children!
        # Order-level adjustments (payment surcharges, shipping) need to be
        # distributed proportionally across child orders by item totals.
        order_level_adjustments = cart.adjustments.where('adjustable_id = ? AND adjustable_type = ?',
                                                          cart.id, 'Spree::Order')

        order_level_adjustments.each do |adjustment|
          # Proportional distribution by item total
          total_item_total = child_orders.sum { |o| o.line_items.sum(:total) }
          next if total_item_total.zero?

          child_orders.each do |child|
            proportion = child.line_items.sum(:total) / total_item_total.to_d
            next if proportion.zero?

            amount = (adjustment.amount * proportion).round(2, :half_up)
            Spree::Adjustment.create!(
              label: adjustment.label,
              amount: amount,
              order: child,
              source: adjustment.source,
              adjustable: child
            )
          end
        end
      end

      def create_payment_splits!
        payment = cart.payments.last
        return unless payment

        child_orders.each do |child|
          Spree::PaymentSplit.create!(
            payment: payment,
            order: child,
            order_group: order_group,
            authorized_amount: child.total,
            currency: child.currency
          )
        end
      end

      def compute_children_totals!
        child_orders.each do |child|
          Spree::OrderUpdater.new(child).update
        end
      end

      def generate_order_group_number
        "OG-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.alphanumeric(6).upcase}"
      end
    end
  end
end
