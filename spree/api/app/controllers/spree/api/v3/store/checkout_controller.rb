# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Store
        # Simple checkout endpoint for PhotoGo.
        #
        # POST /api/v3/store/checkout
        #   { email: "buyer@example.com", items: [{product_id: "prod_123", quantity: 2}], stripe_token: "tok_..." }
        #
        # It creates a Spree::Order, adds the requested line items, marks the order as
        # complete (bypassing real payment for this MVP) and returns the order ID and
        # the commissions that were generated for each vendor.
        class CheckoutController < BaseController
          def create
            payload = params.require(:checkout).permit(:email, :stripe_token, items: [:product_id, :quantity])
            order = Spree::Order.create!(
              store:    Spree::Store.default,
              currency: 'BRL',
              email:    payload[:email],
              state:    'cart'
            )

            payload[:items].each do |item|
              product = Spree::Product.find_by_prefix_id(item[:product_id])
              unless product
                return render json: { error: "Product #{item[:product_id]} not found" }, status: :not_found
              end
              order.contents.add(product.master, item[:quantity].to_i)
            end

            # For MVP we skip real Stripe payment and directly transition to complete.
            # In production replace this with a proper payment integration.
            order.next! while order.can_transition_to_next_state?

            # After the order reaches 'complete', the Photo::OrderCommission concern
            # will automatically generate commissions and schedule a payout.

            # Gather commissions just created for this order.
            commissions = Photo::Commission.where(order: order).map do |c|
              {
                id:          c.prefix_id,
                vendor_id:   c.vendor.prefix_id,
                amount_cents: c.amount_cents,
                currency:    c.currency,
                status:      c.status
              }
            end

            render json: {
              order_id:   order.prefix_id,
              status:     order.state,
              total:      order.total.to_f,
              commissions: commissions
            }, status: :created
          rescue ActionController::ParameterMissing => e
            render json: { error: e.message }, status: :bad_request
          rescue StandardError => e
            render json: { error: e.message }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
