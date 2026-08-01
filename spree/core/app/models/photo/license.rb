# frozen_string_literal: true

module Photo
  # A License represents the terms under which a photo is sold.
  # Each license has a tier (personal, commercial, editorial, exclusive, extended),
  # territory, validity period, and a cryptographic hash for authenticity.
  #
  # The certificate_hash is SHA-256 of (asset_checksum + nonce) — generated
  # by LicenseCertificateGenerator when the PDF is emitted.
  #
  class License < Spree.base_class
    has_prefix_id :lic

    belongs_to :product, class_name: 'Spree::Product'
    belongs_to :vendor,  class_name: 'Spree::Vendor'

    has_many :digital_deliveries, class_name: 'Photo::DigitalDelivery', dependent: :restrict_with_error

    # ──── License tiers ────
    LICENSE_TYPES = %w[personal commercial editorial exclusive extended].freeze

    # Price multipliers per tier (relative to base product price)
    PRICE_MULTIPLIERS = {
      'personal'   => 1.0,
      'editorial'  => 2.0,
      'commercial' => 3.0,
      'extended'   => 5.0,
      'exclusive'  => 10.0
    }.freeze

    enum :license_type, LICENSE_TYPES.index_by(&:itself), default: 'personal', validate: true

    # ──── Validations ────
    validates :license_type, inclusion: { in: LICENSE_TYPES }
    validates :territory,    presence: true
    validates :nonce,        presence: true, uniqueness: true
    validate  :valid_until_after_valid_from

    # ──── Scopes ────
    scope :active,          -> { where('valid_until IS NULL OR valid_until >= ?', Date.current) }
    scope :personal,        -> { where(license_type: 'personal') }
    scope :commercial,      -> { where(license_type: 'commercial') }
    scope :editorial,       -> { where(license_type: 'editorial') }
    scope :exclusive,       -> { where(license_type: 'exclusive') }
    scope :extended,        -> { where(license_type: 'extended') }

    # ──── Callbacks ────
    before_validation :set_default_nonce,    on: :create
    before_validation :set_price_multiplier, on: :create

    # ──── Public methods ────

    # Computes the SHA-256 certificate hash from the asset's checksum + nonce.
    # Returns nil if the asset has no checksum yet.
    def compute_certificate_hash(asset)
      return nil unless asset&.file&.blob&.checksum.present?

      Digest::SHA256.hexdigest("#{asset.file.blob.checksum}:#{nonce}")
    end

    # Sets the certificate_hash from a given asset
    def issue_certificate!(asset)
      hash = compute_certificate_hash(asset)
      return nil unless hash

      update!(certificate_hash: hash)
      hash
    end

    # Price for this license given a base price
    def price_for(base_price)
      (base_price * price_multiplier).round(2)
    end

    # Human-readable description of the license
    def description
      case license_type
      when 'personal'   then 'Uso pessoal, redes sociais, sem revenda'
      when 'commercial' then 'Sites comerciais, anuncios, marketing'
      when 'editorial'  then 'Revistas, blogs, midias jornalisticas'
      when 'exclusive'  then 'Direitos exclusivos, sem revenda pelo fotografo'
      when 'extended'   then 'Uso irrestrito, territorio mundial, prazo ilimitado'
      else license_type.humanize
      end
    end

    # Is this license currently valid?
    def currently_valid?
      return false if valid_from.present? && valid_from > Date.current
      return false if valid_until.present? && valid_until < Date.current
      true
    end

    private

    def set_default_nonce
      self.nonce ||= SecureRandom.hex(16)
    end

    def set_price_multiplier
      self.price_multiplier ||= PRICE_MULTIPLIERS[license_type] || 1.0
    end

    def valid_until_after_valid_from
      return if valid_from.blank? || valid_until.blank?
      errors.add(:valid_until, 'must be after valid_from') if valid_until < valid_from
    end
  end
end
