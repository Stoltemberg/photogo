# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Store
        # Download endpoints — token-gated, rate-limited access to purchased photos.
        # No traditional auth required — the token IS the auth.
        #
        # GET  /api/v3/store/downloads          — list buyer's deliveries (needs auth)
        # GET  /api/v3/store/downloads/:token   — check link status + get signed URL
        # POST /api/v3/store/downloads/:token   — claim a download (records IP/UA, increments count)
        #
        class DownloadsController < BaseController
          # GET /api/v3/store/downloads — buyer's purchase history with download status
          def index
            return render_unauthorized unless current_order_user

            deliveries = Photo::DigitalDelivery
              .joins(:order)
              .where(spree_orders: { user_id: current_order_user.id })
              .includes(:license, :download_links)
              .order(:created_at)

            render json: {
              data: deliveries.map { |d| serialize_delivery(d) }
            }
          end

          # GET /api/v3/store/downloads/:token — check link validity + get signed URL
          def show
            link = Photo::DownloadLink.find_by!(token: params[:token])

            render json: {
              valid:          link.valid?,
              download_count: link.download_count,
              max_downloads:  link.max_downloads,
              remaining:      link.remaining,
              expires_at:     link.expires_at,
              product_name:   link.digital_delivery.license&.product&.name,
              license_type:   link.digital_delivery.license&.license_type,
              signed_url:     link.valid? ? link.signed_url : nil
            }
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'Download link not found' }, status: :not_found
          end

          # POST /api/v3/store/downloads/:token — claim the download
          # Records IP, User-Agent, increments download_count
          def claim
            link = Photo::DownloadLink.find_by!(token: params[:token])

            unless link.valid?
              return render json: {
                error:   'Download link is no longer valid',
                reason:   link_expired_reason(link)
              }, status: :forbidden
            end

            success = link.record_download!(
              ip_address:  request.remote_ip,
              user_agent:  request.user_agent
            )

            if success
              render json: {
                message:       'Download authorized',
                signed_url:     link.signed_url,
                remaining:      link.remaining,
                download_count: link.download_count
              }
            else
              render json: { error: 'Failed to record download' }, status: :unprocessable_entity
            end
          rescue ActiveRecord::RecordNotFound
            render json: { error: 'Download link not found' }, status: :not_found
          end

          private

          def serialize_delivery(delivery)
            {
              id:           delivery.prefix_id,
              status:       delivery.status,
              product_name: delivery.license&.product&.name,
              license_type: delivery.license&.license_type,
              license_id:   delivery.license&.prefix_id,
              max_downloads: delivery.max_downloads,
              total_downloads: delivery.total_downloads,
              remaining:    delivery.remaining_downloads,
              expires_at:   delivery.expires_at,
              delivered_at: delivery.delivered_at,
              download_links: delivery.download_links.map do |l|
                {
                  token:    l.token,
                  valid:    l.valid?,
                  remaining: l.remaining,
                  expires_at: l.expires_at
                }
              end
            }
          end

          def link_expired_reason(link)
            return 'link_revoked'      if link.digital_delivery&.revoked?
            return 'delivery_expired'  if link.digital_delivery&.expired_by_time?
            return 'link_expired'     if link.expired?
            return 'max_downloads_reached' if link.exhausted?
            'unknown'
          end

          def render_unauthorized
            render json: { error: 'Authentication required' }, status: :unauthorized
          end

          def current_order_user
            return @current_order_user if defined?(@current_order_user)
            @current_order_user = try(:current_api_user) || try(:spree_current_user)
          end
        end
      end
    end
  end
end
