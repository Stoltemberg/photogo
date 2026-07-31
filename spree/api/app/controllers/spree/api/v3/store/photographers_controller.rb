# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Store
        # Public photographer profiles — approved vendors with photo-specific data.
        # GET /api/v3/store/photographers          — list (verified or higher)
        # GET /api/v3/store/photographers/:slug    — single profile by vendor slug
        class PhotographersController < BaseController
          # GET /api/v3/store/photographers
          # Optional params: :specialty, :verification_status, :page, :per_page
          def index
            profiles = Photo::PhotographerProfile
              .verified_or_higher
              .joins(:vendor)
              .merge(Spree::Vendor.approved)

            profiles = profiles.where('specialties_json @> ?', [params[:specialty]].to_json) if params[:specialty].present?

            per_page = [params.fetch(:per_page, 24).to_i, 100].min
            page     = [params.fetch(:page, 1).to_i, 1].max
            profiles = profiles.page(page).per(per_page)

            render json: {
              data: profiles.map { |p| serialize_profile(p) },
              meta: { page: page, per_page: per_page, total: profiles.total_count }
            }
          end

          # GET /api/v3/store/photographers/:slug
          def show
            vendor   = Spree::Vendor.approved.find_by!(slug: params[:slug])
            profile  = vendor.photographer_profile || Photo::PhotographerProfile.create!(vendor: vendor)

            render json: serialize_profile(profile, include_products: true)
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'Photographer not found' }, status: :not_found
          end

          private

          def serialize_profile(profile, include_products: false)
            data = {
              id:                   profile.prefix_id,
              name:                 profile.display_name,
              slug:                 profile.vendor.slug,
              about:                profile.about,
              verification_status:  profile.verification_status,
              specialties:          profile.specialties_list,
              links:                profile.links,
              verified:             profile.verified?
            }

            if include_products
              data[:products] = profile.vendor.products.active.map do |product|
                {
                  id:                product.prefix_id,
                  name:              product.name,
                  slug:              product.slug,
                  product_type:      product.product_type,
                  price:             product.default_variant&.price&.to_s,
                  resolution:        product.resolution_string,
                  exif_summary:      product.exif_summary,
                  ai_generated:      product.ai_generated?,
                  model_release:     product.model_release_signed?,
                  property_release:  product.property_release_signed?
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
