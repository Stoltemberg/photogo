# frozen_string_literal: true

module Photo
  # DeliveryMailer sends the digital delivery email to the buyer after
  # payment confirmation. Contains:
  #   - Download link (token-gated, 24h expiry)
  #   - License certificate as PDF attachment (for license products)
  #   - Order summary
  #
  # Usage:
  #   Photo::DeliveryMailer.with(delivery: delivery).delivery_email.deliver_now
  #
  class DeliveryMailer < ApplicationMailer
    default from: -> { Spree::Store.default&.mail_from_address || 'no-reply@photogo.com.br' }

    # GET /mail/delivery_email?delivery_id=...
    def delivery_email
      @delivery    = params[:delivery]
      @order       = @delivery.order
      @license     = @delivery.license
      @product     = @license&.product
      @vendor      = @license&.vendor
      @download_link = @delivery.download_links.order(:created_at).last

      # Attach the license certificate PDF if applicable
      if @license&.certificate_hash.blank? && @delivery.asset
        @license.issue_certificate!(@delivery.asset)
      end

      if @license&.certificate_hash.present?
        certificate_pdf = Photo::LicenseCertificateGenerator.new(@license, @delivery.asset).generate
        attachments['licenca.pdf'] = {
          mime_type: 'application/pdf',
          content:   certificate_pdf
        }
      end

      mail(
        to:      @order.email,
        subject: "Sua foto está pronta para download — #{@product&.name || 'PhotoGo'}"
      )
    end
  end
end
