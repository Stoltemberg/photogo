# frozen_string_literal: true

module Spree
  # CommissionRate — mutable config defining how much the platform charges.
  # Rule-engine resolution: priority-ordered, first-match-wins.
  # Legacy fallback: product.platform_fee || vendor.platform_fee → seeded global rate.

  class CommissionRate < Spree.base_class
    has_prefix_id :comrt

    belongs_to :store, class_name: 'Spree::Store'
    has_many :commission_rules,  class_name: 'Spree::CommissionRule',  dependent: :destroy
    has_many :commission_lines,  class_name: 'Spree::CommissionLine'

    acts_as_paranoid

    validates :code, uniqueness: { scope: [:store_id], conditions: -> { where(deleted_at: nil) } }
    validates :name, :code, presence: true
    validates :value, numericality: { greater_than_or_equal_to: 0 }
    validates :kind, inclusion: { in: %w[percentage fixed] }
    validates :currency, presence: true, if: -> { kind == 'fixed' }
    validates :min_amount, numericality: { greater_than_or_equal_to: 0 }
    validates :max_amount, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
    validates :priority, numericality: { only_integer: true }

    scope :enabled, -> { where(enabled: true) }
    scope :by_priority, -> { order(priority: :desc) }
    scope :for_store, ->(store) { where(store: store) }

    # ──────────────── Resolution ────────────────
    # Walk enabled rates by priority DESC, first match wins.
    # Currency gate only applies to fixed rates (percentage rates are currency-agnostic).
    def self.resolve_for(line_item:)
      order = line_item.order
      vendor = line_item.variant.product.vendor
      store = order.store

      enabled.for_store(store).by_priority.find do |rate|
        rate.matches?(line_item: line_item, vendor: vendor, order: order)
      end
    end

    def matches?(line_item:, vendor:, order:)
      return false unless rate_rules_match?(line_item: line_item, vendor: vendor)
      return false if kind == 'fixed' && currency != order.currency
      true
    end

    def rate_rules_match?(line_item:, vendor:)
      product = line_item.variant.product
      rules = commission_rules.to_a

      # Group by subject_type
      groups = rules.group_by(&:subject_type)

      # Global rate (no rules) always matches
      return true if rules.empty?

      # Every present dimension group needs ≥1 match
      groups.all? do |_subject_type, type_rules|
        type_rules.any? do |rule|
          case rule.subject_type
          when 'Spree::Product'    then rule.subject_id == product.id
          when 'Spree::Taxon'      then product.taxons.pluck(:id).include?(rule.subject_id)
          when 'Spree::Vendor'     then rule.subject_id == vendor&.id
          else true
          end
        end
      end
    end

    # ──────────────── Calculation ────────────────
    def calculate_amount(base_amount:, quantity:)
      per_unit = kind == 'percentage' ? (base_amount * value / 100.0) : value
      amount = per_unit * quantity
      amount = clamp(amount)
      amount
    end

    def clamp(amount)
      amount = [amount, min_amount.to_f].max
      amount = [amount, max_amount.to_f].min if max_amount.present?
      amount.round(2, :half_up)
    end
  end
end
