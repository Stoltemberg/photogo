# frozen_string_literal: true

module Photo
  # ActiveJob that processes a newly uploaded product image:
  #   1. Extracts EXIF metadata and writes to product.exif_data
  #   2. Generates WebP preview (2560px max)
  #   3. Attaches preview to the asset
  #
  # Fallback: if EXIF extraction fails (no exiftool installed), the job
  # still succeeds — the photo is visible without EXIF metadata.
  #
  class ProcessUploadAsset < ApplicationJob
    queue_as :photo_uploads

    PREVIEW_MAX = 2560  # px — enough for retina display, smaller than original

    def perform(product_id, asset_id)
      product = Spree::Product.find_by(id: product_id)
      asset   = Spree::Asset.find_by(id: asset_id)

      return unless product && asset
      return unless asset.file.attached?

      extract_exif(asset, product)
      generate_and_attach_preview(asset)
    rescue StandardError => e
      Rails.logger.error("Photo::ProcessUploadAsset failed for asset ##{asset_id}: #{e.message}")
      # Job does not fail — photo is still uploaded, EXIF/preview are optional
    end

    private

    def extract_exif(asset, product)
      exif = extract_via_exiftool(asset)
      return if exif.blank?

      product.exif_data.merge!(exif)
      product.save!
    rescue StandardError
      nil
    end

    def extract_via_exiftool(asset)
      source = download_to_tempfile(asset.file)
      require 'mini_exiftool'
      metadata = MiniExiftool.new(source.path)
      return if metadata.model.blank?

      {
        camera_make:    metadata.make,
        camera_model:   metadata.model,
        lens_model:     metadata.lens,
        iso:            metadata.iso.to_s,
        aperture:       metadata.aperture.to_s,
        shutter_speed:  metadata.shutter_speed.to_s,
        focal_length:   metadata.focal_length.to_s,
        date_taken:     metadata.date_time_original&.strftime("%Y-%m-%dT%H:%M:%S"),
        exposure_bias:  metadata.exposure_compensation.to_s,
        gps_latitude:   metadata.gps_latitude,
        gps_longitude:  metadata.gps_longitude,
        resolution_width:  metadata.image_width,
        resolution_height: metadata.image_height
      }.compact_blank
    rescue LoadError
      {}
    rescue StandardError => e
      Rails.logger.warn("exif extraction failed: #{e.message}")
      {}
    end

    def generate_and_attach_preview(asset)
      source = download_to_tempfile(asset.file)
      return unless source

      output = Tempfile.new(['preview', '.webp'])
      ImageProcessing::Vips
        .source(source.path)
        .convert('webp')
        .resize_to_limit(PREVIEW_MAX, PREVIEW_MAX)
        .saver(quality: 85)
        .call(destination: output.path)

      asset.variants.create!(
        file: File.open(output.path),
        is_preview: true
      )
      File.unlink(output.path) if File.exist?(output.path)
    rescue StandardError
      nil
    end

    def download_to_tempfile(attachment)
      Tempfile.new(['source', File.extname(attachment.filename.to_s)]).tap do |tf|
        tf.binmode
        tf.write(attachment.download)
        tf.rewind
      end
    end
  end
end