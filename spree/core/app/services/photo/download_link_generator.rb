# frozen_string_literal: true

module Photo
  # Generates a DownloadLink for a DigitalDelivery.
  #
  # Creates a token-gated link with:
  #   - URL-safe random token (32 bytes)
  #   - Expiry time (default: 24h from now)
  #   - Max downloads (default: from delivery config)
  #   - Signed S3 URL for the original asset
  #
  # If the asset has no S3 attachment (e.g. local storage), signed_url
  # falls back to a Rails URL helper path.
  #
  # Usage:
  #   generator = Photo::DownloadLinkGenerator.new(delivery)
  #   link = generator.generate!(ttl: 24.hours, max_downloads: 3)
  #   link.token     # => "abc123..."
  #   link.signed_url # => "https://s3.amazonaws.com/..."
  #
  class DownloadLinkGenerator
    attr_reader :delivery

    def initialize(delivery)
      @delivery = delivery
    end

    def generate!(ttl: 24.hours, max_downloads: 3)
      token     = SecureRandom.urlsafe_base64(32)
      expires_at = ttl.from_now
      signed_url = build_signed_url(expires_at)

      Photo::DownloadLink.create!(
        digital_delivery:  delivery,
        token:              token,
        expires_at:         expires_at,
        max_downloads:      max_downloads,
        signed_url:         signed_url
      )
    end

    private

    # Build a signed S3 URL for the asset's original file.
    # Falls back to nil if the asset has no attached file.
    def build_signed_url(expires_at)
      return nil unless delivery.asset&.file&.attached?

      blob = delivery.asset.file.blob
      expiry_seconds = [(expires_at - Time.current).to_i, 60].max

      begin
        # Active Storage with S3 service
        if blob.service.respond_to?(:url)
          # S3 service supports expiry option
          blob.service.url(blob.key, expires_in: expiry_seconds, disposition: :attachment, filename: blob.filename)
        else
          # Local/disk service — returns nil, frontend uses token endpoint instead
          nil
        end
      rescue StandardError => e
        Rails.logger.warn("DownloadLinkGenerator: could not build signed URL: #{e.message}")
        nil
      end
    end
  end
end
