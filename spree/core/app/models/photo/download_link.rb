# frozen_string_literal: true

module Photo
  # A DownloadLink is a token-gated, expiring URL for downloading the original photo.
  # Each DigitalDelivery can have multiple links (e.g. re-issue after expiry).
  #
  # The link tracks download_count, IP, user_agent for audit/anti-piracy.
  # A link is valid while:
  #   - download_count < max_downloads
  #   - expires_at > Time.current
  #   - digital_delivery.status == 'delivered' (not revoked/expired)
  #
  class DownloadLink < Spree.base_class
    has_prefix_id :dlink

    belongs_to :digital_delivery, class_name: 'Photo::DigitalDelivery', counter_cache: true

    # ──── Validations ────
    validates :token,     presence: true, uniqueness: true
    validates :expires_at, presence: true
    validates :max_downloads, numericality: { only_integer: true, greater_than: 0 }
    validates :download_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

    # ──── Scopes ────
    scope :active,     -> { where('expires_at >= ?', Time.current).where('download_count < max_downloads') }
    scope :expired,    -> { where('expires_at < ?', Time.current) }
    scope :exhausted,  -> { where('download_count >= max_downloads') }

    # ──── Callbacks ────
    before_validation :set_default_token, on: :create

    # ──── Public methods ────

    # Is this link still usable?
    def valid?
      return false if digital_delivery&.revoked?
      return false if digital_delivery&.expired_by_time?
      return false if expired?
      return false if exhausted?
      true
    end

    # Is the link expired by time?
    def expired?
      expires_at.present? && expires_at < Time.current
    end

    # Has the link reached max downloads?
    def exhausted?
      download_count >= max_downloads
    end

    # Remaining downloads on this link
    def remaining
      [max_downloads - download_count, 0].max
    end

    # Record a download attempt. Returns true if the download was recorded,
    # false if the link is no longer valid.
    def record_download!(ip_address: nil, user_agent: nil)
      return false unless valid?

      log_entry = { ip: ip_address, ua: user_agent, at: Time.current.iso8601 }

      update!(
        download_count:    download_count + 1,
        last_downloaded_at: Time.current,
        ip_address:        ip_address,
        user_agent:        user_agent,
        download_logs:     (download_logs || []) + [log_entry]
      )
      true
    end

    private

    def set_default_token
      self.token ||= SecureRandom.urlsafe_base64(32)
    end
  end
end
