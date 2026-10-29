# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Store
        class VendorsController < BaseController
          # GET /api/v3/store/vendors — public profiles (approved only)
          def index
            vendors = Spree::Vendor.approved
              .where('holiday_mode_until IS NULL OR holiday_mode_until < ?', Time.current)
              .order(:name)

            render json: {
              data: vendors.map { |v| serialize_public_profile(v) }
            }
          end

          # GET /api/v3/store/vendors/:slug — public profile
          def show
            vendor = Spree::Vendor.approved.find_by!(slug: params[:slug])
            render json: serialize_public_profile(vendor)
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'Photographer not found' }, status: :not_found
          end

          # POST /api/v3/store/vendor_applications — self-serve "become a seller"
          # Rate-limited, no auth required
          def create
            vendor = Spree::Vendor.new(
              name: params[:name],
              contact_email: params[:contact_email],
              about: params[:message],
              store: current_store,
              status: 'pending'
            )

            if vendor.save
              render json: {
                message: 'Your application has been received. We will review it shortly.',
                id: vendor.prefix_id
              }, status: :created
            else
              render json: { errors: vendor.errors.full_messages }, status: :unprocessable_entity
            end
          end

          private

          def serialize_public_profile(vendor)
            {
              id: vendor.prefix_id,
              name: vendor.name,
              slug: vendor.slug,
              about: vendor.about,
              photos_count: vendor.products.count,
              created_at: vendor.created_at
            }
          end
        end
      end
    end
  end
end
