# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Admin
        class VendorsController < ResourceController
          scoped_resource :vendors

          before_action :require_vendor!, only: [:approve, :reject, :suspend]

          # GET /api/v3/admin/vendors
          def index
            @collection = collection
            render json: { data: serialize_collection(@collection), meta: collection_meta(@collection) }
          end

          # GET /api/v3/admin/vendors/:id
          def show
            render json: serialize_resource(@resource)
          end

          # POST /api/v3/admin/vendors
          def create
            @resource = Spree::Vendor.new(permitted_params)
            @resource.store ||= current_store

            if @resource.save
              render json: serialize_resource(@resource), status: :created
            else
              render_validation_error(@resource.errors)
            end
          end

          # PATCH /api/v3/admin/vendors/:id
          def update
            if @resource.update(permitted_params)
              render json: serialize_resource(@resource.reload)
            else
              render_validation_error(@resource.errors)
            end
          end

          # DELETE /api/v3/admin/vendors/:id
          def destroy
            @resource.discard  # paranoia soft-delete
            head :no_content
          end

          # POST /api/v3/admin/vendors/:id/approve
          def approve
            @resource.approve!
            render json: serialize_resource(@resource.reload)
          end

          # POST /api/v3/admin/vendors/:id/reject
          def reject
            @resource.reject!
            render json: serialize_resource(@resource.reload)
          end

          # POST /api/v3/admin/vendors/:id/suspend
          def suspend
            @resource.suspend!
            render json: serialize_resource(@resource.reload)
          end

          # GET /api/v3/admin/vendors/:id/payouts
          def payouts
            payouts = @resource.vendor_payouts.order(created_at: :desc)
            render json: { data: payouts.map { |p| serialize_payout(p) } }
          end

          # GET /api/v3/admin/vendors/:id/transfers
          def transfers
            transfers = @resource.vendor_transfers.order(created_at: :desc)
            render json: { data: transfers.map { |t| serialize_transfer(t) } }
          end

          private

          def require_vendor!
            render json: { error: 'Vendor not found' }, status: :not_found unless @resource
          end

          def serialize_resource(vendor)
            {
              id: vendor.prefix_id,
              name: vendor.name,
              slug: vendor.slug,
              status: vendor.status,
              contact_email: vendor.contact_email,
              about: vendor.about,
              tax_type: vendor.tax_type,
              payout_provider: vendor.payout_provider,
              stripe_account_id: vendor.stripe_account_id.present? ? '●●●●' : nil,
              onboarding_tasks: vendor.onboarding_tasks,
              balance_brl: vendor.balance('BRL'),
              created_at: vendor.created_at,
              updated_at: vendor.updated_at
            }
          end

          def serialize_collection(vendors)
            vendors.map { |v| serialize_resource(v) }
          end

          def serialize_payout(payout)
            {
              id: payout.prefix_id,
              amount: payout.amount.to_f,
              currency: payout.currency,
              status: payout.status,
              period_start: payout.period_start,
              period_end: payout.period_end,
              created_at: payout.created_at
            }
          end

          def serialize_transfer(transfer)
            {
              id: transfer.prefix_id,
              amount: transfer.amount.to_f,
              currency: transfer.currency,
              kind: transfer.kind,
              status: transfer.status,
              order_id: transfer.order.prefix_id,
              payout_id: transfer.payout&.prefix_id,
              created_at: transfer.created_at
            }
          end

          def permitted_params
            params.require(:vendor).permit(
              :name, :slug, :contact_email, :billing_email,
              :about, :tax_type, :tax_id,
              :payouts_schedule_interval, :payout_provider
            )
          end
        end
      end
    end
  end
end
