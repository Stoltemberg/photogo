# frozen_string_literal: true

module Spree
  module Product
    # Photo-specific product domain for PhotoGo.
    #
    # Included into Spree::Product via engine.to_prepare.
    # Adds:
    #   - product_type enum (digital_photo, print, license, service, bundle)
    #   - EXIF metadata via store_accessor on exif_data JSONB
    #   - GPS coordinates
    #   - Release flags (model, property, AI)
    #   - Resolution + color space
    #
    # Usage:
    #   product = Spree::Product.first
    #   product.digital_photo?           # true
    #   product.camera_make              # "Canon"
    #   product.focal_length             # "85mm"
    #   product.model_release_signed?    # true
    module PhotoProduct
      extend ActiveSupport::Concern

      PRODUCT_TYPES = %w[
        digital_photo
        print
        license
        service
        bundle
      ].freeze

      included do
        enum :product_type, PRODUCT_TYPES.index_by(&:itself).transform_values { |v| v.to_s },
             default: 'digital_photo',
             validate: true

        # EXIF fields — accessible via DSL, persisted in exif_data JSONB
        store_accessor :exif_data,
          :camera_make,
          :camera_model,
          :lens_model,
          :iso,
          :aperture,
          :shutter_speed,
          :focal_length,
          :date_taken,
          :exposure_bias,
          :software

        # Validations
        validates :product_type, inclusion: { in: PRODUCT_TYPES }
        validates :resolution_width,  numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
        validates :resolution_height, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
        validates :dpi,               numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

        # Scopes
        scope :digital_photo, -> { where(product_type: 'digital_photo') }
        scope :print,         -> { where(product_type: 'print') }
        scope :license,       -> { where(product_type: 'license') }
        scope :service,       -> { where(product_type: 'service') }
        scope :bundle_product, -> { where(product_type: 'bundle') }
        scope :ai_generated,  -> { where(ai_generated: true) }
        scope :near_location, ->(lat, lng, radius_km = 10) {
          # Approximate: haversine-style filter with bounding box
          where('gps_latitude BETWEEN ? AND ? AND gps_longitude BETWEEN ? AND ?',
            lat - radius_km / 111.0, lat + radius_km / 111.0,
            lng - radius_km / (111.0 * Math.cos(lat * Math::PI / 180)),
            lng + radius_km / (111.0 * Math.cos(lat * Math::PI / 180)))
        }
      end

      # ────── Convenience methods ──────

      def digital_photo?
        product_type == 'digital_photo'
      end

      def print?
        product_type == 'print'
      end

      def license?
        product_type == 'license'
      end

      def service?
        product_type == 'service'
      end

      def bundle?
        product_type == 'bundle'
      end

      # Returns a hash of non-nil EXIF data for display
      def exif_summary
        exif_data.compact_blank
      end

      # Short string like "Canon EOS R5 · f/2.8 · 1/200s · ISO 100 · 85mm"
      def exif_string
        parts = []
        parts << "#{camera_make} #{camera_model}"                     if camera_make.present?
        parts << "f/#{aperture}"                                     if aperture.present?
        parts << "#{shutter_speed}s"                                 if shutter_speed.present?
        parts << "ISO #{iso}"                                       if iso.present?
        parts << focal_length                                        if focal_length.present?
        parts.compact.join(" · ")
      end

      # For product display cards — resolution in the format "6000×4000 @ 300 DPI"
      def resolution_string
        return nil unless resolution_width && resolution_height
        "#{resolution_width}×#{resolution_height}" + (dpi&.positive? ? " @ #{dpi} DPI" : "")
      end

      # Check if GPS coordinates are present
      def gps_coordinates?
        gps_latitude.present? && gps_longitude.present?
      end

      # GPS as [lat, lng] array
      def gps_coordinates
        [gps_latitude, gps_longitude] if gps_coordinates?
      end
    end
  end
end