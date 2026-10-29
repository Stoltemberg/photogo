# frozen_string_literal: true

module Spree
  # CommissionRule — targeting rule for commission rate resolution.
  # Grouped by subject_type: AND across dimensions, OR within one dimension.
  # {taxon: Electronics, taxon: Cameras, vendor: X} = (Electronics OR Cameras) AND vendor X.

  class CommissionRule < Spree.base_class
    belongs_to :commission_rate, class_name: 'Spree::CommissionRate'
    belongs_to :subject, polymorphic: true, optional: true  # Spree::Product | Spree::Taxon | Spree::Vendor

    validates :subject_type, inclusion: { in: %w[Spree::Product Spree::Taxon Spree::Vendor], allow_nil: true }
  end
end
