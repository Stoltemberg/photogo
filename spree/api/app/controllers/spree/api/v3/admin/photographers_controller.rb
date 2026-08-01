# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Admin
        # Admin management of photographer profiles.
        # GET    /api/v3/admin/photographers                — list all
        # GET    /api/v3/admin/photographers/:id            — single profile
        # PATCH  /api/v3/admin/photographers/:id            — update about/links/specialties
        # POST   /api/v3/admin/photographers/:id/verify     — set verification_status
        # POST   /api/v3/admin/photographers/:id/feature    — mark as featured
        class PhotographersController < BaseController
          before_action :scope_resource, only: %i[show update verify feature]

          # GET /api/v3/admin/photographers
          def index
            profiles = Photo::PhotographerProfile.all.includes(:vendor)

            profiles = profiles.where(verification_status: params[:status]) if params[:status].present?

            per_page = [params.fetch(:per_page, 24).to_i, 100].min
            page     = [params.fetch(:page, 1).to_i, 1].max
            profiles = profiles.page(page).per(per_page)

            render json: {
              data: profiles.map { |p| serialize_admin_profile(p) },
              meta: { page: page, per_page: per_page, total: profiles.total_count }
            }
          end

          # GET /api/v3/admin/photographers/:id
          def show
            render json: serialize_admin_profile(@profile, include_products: true)
          end

          # PATCH /api/v3/admin/photographers/:id
          def update
            if @profile.update!(permitted_update_params)
              render json: serialize_admin_profile(@profile)
            else
              render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
            end
          end

          # POST /api/v3/admin/photographers/:id/verify
          # Body: { verification_status: "verified" | "pro" | "featured" | "rejected" }
          def verify
            status = params[:verification_status]&.to_s
            unless %w[verified pro featured rejected].include?(status)
              return render json: { error: 'Invalid verification_status' }, status: :unprocessable_entity
            end

            @profile.update!(verification_status: status)
            render json: { message: "Verification status set to #{status}", profile: serialize_admin_profile(@profile) }
          end

          # POST /api/v3/admin/photographers/:id/feature
          def feature
            @profile.update!(verification_status: 'featured')
            render json: { message: 'Photographer featured', profile: serialize_admin_profile(@profile) }
          end

          private

          def scope_resource
            @profile = Photo::PhotographerProfile.find_by_prefix_id!(params[:id])
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'Photographer profile not found' }, status: :not_found
          end

          def permitted_update_params
            params.require(:photographer_profile).permit(
              :about,
              :verification_status,
              specialties_json: [],
              links: {}
            )
          end

          def serialize_admin_profile(profile, include_products: false)
            data = {
              id:                  profile.prefix_id,
              vendor_id:           profile.vendor.prefix_id,
              name:                profile.display_name,
              slug:                profile.vendor.slug,
              about:               profile.about,
              verification_status: profile.verification_status,
              specialties:         profile.specialties_list,
              links:               profile.links,
              created_at:          profile.created_at,
              updated_at:          profile.updated_at,
              vendor_status:       profile.vendor.status
            }

            if include_products
              data[:products] = profile.vendor.products.map do |product|
                {
                  id:            product.prefix_id,
                  name:          product.name,
                  slug:          product.slug,
                  product_type:  product.product_type,
                  status:        product.status,
                  ai_generated:  product.ai_generated?
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
