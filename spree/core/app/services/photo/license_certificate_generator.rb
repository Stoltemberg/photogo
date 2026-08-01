# frozen_string_literal: true

module Photo
  # Generates a PDF/A License Certificate for a Photo::License.
  #
  # The certificate contains:
  #   - PhotoGo branding header
  #   - Low-resolution preview of the photo (thumbnail)
  #   - Photo name, photographer name
  #   - License type (personal, commercial, editorial, exclusive, extended)
  #   - Territory and validity period
  #   - Purchase date
  #   - SHA-256 authenticity hash
  #   - QR code for online verification (optional)
  #   - Copyright notice
  #
  # Requirements:
  #   - prawn gem (PDF generation)
  #   - prawn-qrcode gem (QR code rendering, optional)
  #
  # Usage:
  #   generator = Photo::LicenseCertificateGenerator.new(license, asset)
  #   pdf_bytes = generator.generate
  #   File.binwrite('certificate.pdf', pdf_bytes)
  #
  class LicenseCertificateGenerator
    attr_reader :license, :asset

    def initialize(license, asset = nil)
      @license = license
      @asset   = asset || license.product&.primary_media
    end

    # Generate the PDF certificate as a binary string.
    # Also stamps the certificate_hash onto the license.
    def generate
      hash = license.issue_certificate!(asset) if license.certificate_hash.blank?

      Prawn::Document.new(page_size: 'A4', margin: 50) do |pdf|
        # ──── Header ────
        pdf.text 'PhotoGo', size: 28, style: :bold, color: [255, 107, 53]
        pdf.text 'Certificate of License', size: 16, style: :bold
        pdf.move_down 20

        # ──── Photo preview ────
        if asset_preview_path
          pdf.image asset_preview_path, fit: [300, 300], position: :center
          pdf.move_down 10
        end

        # ──── License details ────
        details = [
          ['Photo',       license.product&.name || 'Unknown'],
          ['Photographer', license.vendor&.name || 'Unknown'],
          ['License Type', license.license_type.humanize],
          ['Description',  license.description],
          ['Territory',    license.territory.humanize],
          ['Valid From',   license.valid_from&.strftime('%d/%m/%Y') || 'Unlimited'],
          ['Valid Until',  license.valid_until&.strftime('%d/%m/%Y') || 'Unlimited'],
          ['Issued',       Date.current.strftime('%d/%m/%Y')],
          ['License ID',   license.prefix_id.to_s]
        ]

        details.each do |label, value|
          pdf.text "<b>#{label}:</b>  #{value}", inline_format: true, size: 11
          pdf.move_down 4
        end

        pdf.move_down 20

        # ──── Authenticity hash ────
        pdf.text 'Authenticity Verification', size: 14, style: :bold
        pdf.move_down 5
        pdf.text "SHA-256: #{license.certificate_hash || hash || 'N/A'}", size: 9, font: 'Courier'
        pdf.move_down 5
        pdf.text 'Scan the QR code or visit photogo.com.br/verify to verify this license.',
                  size: 9, color: [90, 90, 90]

        # ──── QR code (optional, if prawn-qrcode is available) ────
        if qr_code_available? && license.certificate_hash.present?
          begin
            qrcode = RQRCode::QRCode.new(
              "https://photogo.com.br/verify/#{license.prefix_id}/#{license.certificate_hash}"
            )
            pdf.render_qr_code(qrcode, extent: 80, align: :center)
          rescue
            nil
          end
        end

        pdf.move_down 30

        # ──── Footer ────
        pdf.text "© #{Date.current.year} #{license.vendor&.name || 'PhotoGo'}. All rights reserved.",
                  size: 9, align: :center, color: [120, 120, 120]
        pdf.text 'This certificate is issued by PhotoGo and constitutes proof of license.',
                  size: 8, align: :center, color: [150, 150, 150]
      end.render
    end

    private

    # Download the asset preview to a tempfile for Prawn image embedding.
    def asset_preview_path
      return nil unless asset&.file&.attached?

      @preview_tempfile ||= begin
        tf = Tempfile.new(['cert-preview', '.jpg'])
        tf.binmode
        tf.write(asset.file.blob.download)
        tf.rewind
        tf.path
      end
    rescue
      nil
    end

    def qr_code_available?
      defined?(RQRCode) && defined?(Prawn::QRCode)
    end
  end
end
