# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Admin
        # Admin management of Photo Licenses.
        #
        # GET    /api/v3/admin/licenses                 — list all licenses
        # GET    /api/v3/admin/licenses/:id              — single license
        # POST   /api/v3/admin/licenses                 — create license for a product
        # PATCH  /api/v3/admin/licenses/:id              — update license details
        # POST   /api/v3/admin/licenses/:id/issue_certificate — generate PDF certificate hash
        # POST   /api/v3/admin/licenses/:id/revoke       — revoke license
        #
        class LicensesController < BaseController
          before_action :scope_resource, only: %i[show update issue_certificate revoke]

          # GET /api/v3/admin/licenses
          def index
            licenses = Photo::License.includes(:product, :vendor).all

            licenses = licenses.where(license_type: params[:type]) if params[:type].present?
            licenses = licenses.where(vendor_id: params[:vendor_id]) if params[:vendor_id].present?

            per_page = [params.fetch(:per_page, 24).to_i, 100].min
            page     = [params.fetch(:page, 1).to_i, 1].max
            licenses = licenses.page(page).per(per_page)

            render json: {
              data: licenses.map { |l| serialize_license(l) },
              meta: { page: page, per_page: per_page, total: licenses.total_count }
            }
          end

          # GET /api/v3/admin/licenses/:id
          def show
            render json: serialize_license(@license, include_deliveries: true)
          end

          # POST /api/v3/admin/licenses
          def create
            license = Photo::License.new(permitted_create_params)

            if license.save
              render json: serialize_license(license), status: :created
            else
              render json: { errors: license.errors.full_messages }, status: :unprocessable_entity
            end
          end

          # PATCH /api/v3/admin/licenses/:id
          def update
            if @license.update!(permitted_update_params)
              render json: serialize_license(@license)
            else
              render json: { errors: @license.errors.full_messages }, status: :unprocessable_entity
            end
          end

          # POST /api/v3/admin/licenses/:id/issue_certificate
          # Body: { asset_id: "ast_..." } (optional, falls back to product primary media)
          def issue_certificate
            asset = params[:asset_id].present? ? Spree::Asset.find_by_prefix_id(params[:asset_id]) : @license.product&.primary_media

            unless asset
              return render json: { error: 'No asset found for this license' }, status: :unprocessable_entity
            end

            hash = @license.issue_certificate!(asset)

            if hash
              # Generate the PDF certificate
              pdf_bytes = Photo::LicenseCertificateGenerator.new(@license, asset).generate

              render json: {
                message: 'Certificate issued',
                certificate_hash: hash,
                license: serialize_license(@license),
                pdf_available: true
              }
            else
              render json: { error: 'Could not compute certificate hash' }, status: :unprocessable_entity
            end
          end

          # POST /api/v3/admin/licenses/:id/revoke
          def revoke
            @license.update!(metadata: @license.metadata.merge('revoked' => true, 'revoked_at' => Time.current.iso8601))
            @license.digital_deliveries.each(&:revoke!)

            render json: { message: 'License revoked and all deliveries expired', license: serialize_license(@license) }
          end

          private

          def scope_resource
            @license = Photo::License.find_by_prefix_id!(params[:id])
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'License not found' }, status: :not_found
          end

          def permitted_create_params
            params.require(:license).permit(
              :product_id, :vendor_id, :license_type, :territory,
              :valid_from, :valid_until, :price_multiplier
            )
          end

          def permitted_update_params
            params.require(:license).permit(
              :license_type, :territory,
              :valid_from, :valid_until, :price_multiplier
            )
          end

          def serialize_license(license, include_deliveries: false)
            data = {
              id:                license.prefix_id,
              product_id:        license.product&.prefix_id,
              product_name:      license.product&.name,
              vendor_id:         license.vendor&.prefix_id,
              vendor_name:       license.vendor&.name,
              license_type:      license.license_type,
              description:       license.description,
              territory:         license.territory,
              valid_from:        license.valid_from,
              valid_until:       license.valid_until,
              price_multiplier:  license.price_multiplier.to_s,
              certificate_hash:  license.certificate_hash,
              nonce:             license.nonce,
              currently_valid:   license.currently_valid?,
              created_at:        license.created_at
            }

            if include_deliveries
              data[:deliveries] = license.digital_deliveries.map do |d|
                {
                  id:                d.prefix_id,
                  status:            d.status,
                  order_id:          d.order&.prefix_id,
                  max_downloads:     d.max_downloads,
                  total_downloads:   d.total_downloads
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
