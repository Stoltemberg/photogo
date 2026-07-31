# frozen_string_literal: true

module Photo
  # A PhotographerProfile extends Spree::Vendor with photo-specific metadata.
  # It reuses the vendor (since the vendor IS the photographer) and adds
  # specialties, verification status, social links, about text, portfolio attachments.
  class PhotographerProfile < Spree.base_class
    has_prefix_id :photog

    belongs_to :vendor, class_name: 'Spree::Vendor'

    # Portfolio
    has_one_attached :cover_photo
    has_many_attached :portfolio_samples

    # Verification
    enum :verification_status, {
      pending:      'pending',
      under_review: 'under_review',
      verified:     'verified',
      pro:          'pro',
      featured:     'featured',
      rejected:     'rejected'
    }, default: 'pending'

    # Specialties (stored as JSON array)
    SPECIALTIES = %w[
      wedding landscape portrait street fashion
      wildlife sport family food fine_art macro
      underwater event real_estate documentary architecture
    ].freeze

    # Social links stored in JSONB
    store_accessor :links,
      :website, :instagram, :twitter, :youtube, :behance, :flickr, :px500

    # About text
    validates :about, length: { maximum: 5_000 }, allow_blank: true

    # Scopes
    scope :verified_or_higher, -> { where(verification_status: %w[verified pro featured]) }
    scope :featured,           -> { where(verification_status: :featured) }
    scope :pro_or_higher,      -> { where(verification_status: %w[pro featured]) }

    def display_name
      vendor&.name || "Photographer"
    end

    def specialties_list
      (specialties_json || []).select { |s| SPECIALTIES.include?(s) }
    end

    def add_specialty(specialty)
      list = (specialties_json || [])
      list << specialty unless list.include?(specialty)
      update!(specialties_json: list)
    end
  end
end