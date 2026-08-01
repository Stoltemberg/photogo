# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Admin
        # Admin management of Photo Payouts.
        #
        # GET    /api/v3/admin/payouts                — list all payouts (filter by status/vendor)
        # GET    /api/v3/admin/payouts/:id             — single payout with commissions
        # POST   /api/v3/admin/payouts/:id/process     — trigger StripePayoutProcessor for this payout
        # POST   /api/v3/admin/payouts/:id/mark_paid   — manually mark as paid (after Stripe webhook)
        # POST   /api/v3/admin/payouts/:id/mark_failed — manually mark as failed
        #
        class PayoutsController < BaseController
          before_action :scope_payout, only: %i[show process mark_paid mark_failed]

          # GET /api/v3/admin/payouts
          def index
            payouts = Photo::Payout.includes(:vendor).all

            payouts = payouts.where(status: params[:status])     if params[:status].present?
            payouts = payouts.where(vendor_id: params[:vendor_id]) if params[:vendor_id].present?

            per_page = [params.fetch(:per_page, 24).to_i, 100].min
            page     = [params.fetch(:page, 1).to_i, 1].max
            payouts  = payouts.page(page).per(per_page)

            render json: {
              data: payouts.map { |p| serialize_payout(p) },
              meta: { page: page, per_page: per_page, total: payouts.total_count }
            }
          end

          # GET /api/v3/admin/payouts/:id
          def show
            render json: serialize_payout(@payout, include_commissions: true)
          end

          # POST /api/v3/admin/payouts/:id/process
          # Triggers the StripePayoutProcessor for this single payout.
          def process
            unless @payout.scheduled?
              return render json: { error: 'Payout is not in scheduled state' }, status: :unprocessable_entity
            end

            # Reload commissions and update amount
            pending = Photo::Commission.where(vendor: @payout.vendor, status: :pending)
            total   = pending.sum(:amount_cents)
            @payout.update!(amount_cents: total) if total > 0

            # Trigger Stripe transfer via the provider
            vendor_payout = Spree::VendorPayout.find_or_initialize_by(vendor: @payout.vendor)
            vendor_payout.amount_cents = total
            vendor_payout.currency     = @payout.currency
            vendor_payout.save!

            Spree::Payouts::StripeConnect.new.pay!(vendor_payout)
            @payout.update!(status: :processing)

            render json: {
              message: 'Payout processing initiated',
              payout:  serialize_payout(@payout, include_commissions: true)
            }
          rescue StandardError => e
            @payout.update!(status: :failed)
            render json: { error: e.message, payout: serialize_payout(@payout) }, status: :unprocessable_entity
          end

          # POST /api/v3/admin/payouts/:id/mark_paid
          # Marks the payout and all its pending commissions as paid.
          def mark_paid
            ActiveRecord::Base.transaction do
              @payout.mark_paid!
              Photo::Commission
                .where(vendor: @payout.vendor, status: :pending)
                .update_all(status: :paid, stripe_transfer_id: @payout.stripe_payout_id)
            end

            render json: { message: 'Payout marked as paid', payout: serialize_payout(@payout, include_commissions: true) }
          end

          # POST /api/v3/admin/payouts/:id/mark_failed
          def mark_failed
            @payout.mark_failed!
            render json: { message: 'Payout marked as failed', payout: serialize_payout(@payout) }
          end

          private

          def scope_payout
            @payout = Photo::Payout.find_by_prefix_id!(params[:id])
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'Payout not found' }, status: :not_found
          end

          def serialize_payout(payout, include_commissions: false)
            data = {
              id:            payout.prefix_id,
              vendor_id:     payout.vendor&.prefix_id,
              vendor_name:   payout.vendor&.name,
              amount_cents:  payout.amount_cents,
              currency:      payout.currency,
              status:        payout.status,
              stripe_payout_id: payout.stripe_payout_id,
              scheduled_at:  payout.scheduled_at,
              created_at:    payout.created_at,
              updated_at:    payout.updated_at
            }

            if include_commissions
              data[:commissions] = Photo::Commission
                .where(vendor: payout.vendor)
                .order(:created_at)
                .map do |c|
                  {
                    id:                 c.prefix_id,
                    order_id:           c.order&.prefix_id,
                    amount_cents:       c.amount_cents,
                    currency:           c.currency,
                    status:             c.status,
                    stripe_transfer_id: c.stripe_transfer_id,
                    created_at:          c.created_at
                  }
                end
            end

            data
          end
        end
      end
    end
  end
end
