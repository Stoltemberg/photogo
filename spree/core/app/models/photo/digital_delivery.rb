# frozen_string_literal: true

module Photo
  # A DigitalDelivery is created after payment confirmation for a digital_photo
  # or license product. It connects the order, the asset (the actual photo file),
  # and the license (terms of use).
  #
  # DigitalDelivery has many DownloadLinks — each link is a token-gated,
  # expiring URL for downloading the original photo.
  #
  # Lifecycle: pending → delivered → expired → revoked
  #
  class DigitalDelivery < Spree.base_class
    has_prefix_id :digdl

    belongs_to :order,   class_name: 'Spree::Order'
    belongs_to :asset,   class_name: 'Spree::Asset'
    belongs_to :license, class_name: 'Photo::License'

    has_many :download_links, class_name: 'Photo::DownloadLink', dependent: :destroy

    # ──── State ────
    STATUSES = %w[pending delivered expired revoked].freeze

    enum :status, STATUSES.index_by(&:itself), default: 'pending', validate: true

    # ──── Validations ────
    validates :max_downloads, numericality: { only_integer: true, greater_than: 0 }
    validates :download_ttl_hours, numericality: { only_integer: true, greater_than: 0 }

    # ──── Scopes ────
    scope :pending,     -> { where(status: 'pending') }
    scope :delivered,   -> { where(status: 'delivered') }
    scope :expired,     -> { where(status: 'expired') }
    scope :revoked,     -> { where(status: 'revoked') }
    scope :active,      -> { where(status: 'delivered').where('expires_at IS NULL OR expires_at >= ?', Time.current) }

    # ──── Callbacks ────
    before_save :compute_expires_at, if: :delivered?

    # ──── Public methods ────

    # Mark as delivered and compute expiry
    def mark_delivered!
      update!(status: 'delivered', delivered_at: Time.current)
      compute_expires_at
      save!
    end

    # Revoke access (e.g. after a refund)
    def revoke!
      update!(status: 'revoked')
      download_links.update_all(expires_at: Time.current) # expire all links immediately
    end

    # Check if expired by time
    def expired_by_time?
      expires_at.present? && expires_at < Time.current
    end

    # Total downloads across all links
    def total_downloads
      download_links.sum(:download_count)
    end

    # Remaining downloads
    def remaining_downloads
      [max_downloads - total_downloads, 0].max
    end

    # Can the buyer still download?
    def can_download?
      delivered? && !expired_by_time? && remaining_downloads > 0
    end

    # Generate a new download link for this delivery
    def generate_download_link!(ttl: nil, max_downloads: nil)
      ttl ||= download_ttl_hours.hours
      max_downloads ||= self.max_downloads

      Photo::DownloadLinkGenerator.new(self).generate!(ttl: ttl, max_downloads: max_downloads)
    end

    private

    def compute_expires_at
      return unless delivered_at.present?
      self.expires_at = delivered_at + download_ttl_hours.hours
    end
  end
end
