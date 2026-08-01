# frozen_string_literal: true

# Migration: create commission tables
#
# CommissionRate = mutable config (rules, rate, currency, min/max cap)
# CommissionRule = targeting rule (polymorphic subject → Product | Taxon | Vendor)
# CommissionLine = frozen snapshot line attached to order line item, computed once at placement
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md`:
# Commission is NOT a Spree::Fee. Fee is buyer-facing; CommissionLine is
# platform ↔ vendor settlement line the customer never sees.

class CreateSpreeCommissionTables < ActiveRecord::Migration[7.2]
  def change
    # ──────────────── CommissionRate (mutable config) ────────────────
    create_table :spree_commission_rates do |t|
      t.string   :prefix_id,  null: false
      t.string   :code,       null: false          # unique per store
      t.string   :name,       null: false
      t.string   :kind,       null: false, default: 'percentage' # 'percentage' | 'fixed'
      t.decimal  :value,      null: false, precision: 10, scale: 2
      t.string   :currency,   null: false, default: 'BRL'  # REQUIRED when kind == 'fixed'
      t.boolean  :include_tax,      null: false, default: false  # compute base on item gross vs net (EU default: net)
      t.boolean  :include_shipping, null: false, default: false  # also commission delivery amounts
      t.decimal  :min_amount,       precision: 10, scale: 2, default: 0.0
      t.decimal  :max_amount,       precision: 10, scale: 2        # nullable cap
      t.boolean  :enabled,          null: false, default: true
      t.integer  :priority,         null: false, default: 0        # DESC, first-match-wins
      t.string   :commission_tax_rate  # explicit override; nil → TaxProvider lookup → store default → 0
      t.references :store, null: false, foreign_key: { to_table: :spree_stores }, index: true
      t.timestamps
      t.datetime :deleted_at
    end

    add_index :spree_commission_rates, :prefix_id, unique: true
    add_index :spree_commission_rates, [:code, :store_id], unique: true, name: 'idx_commission_rates_code_store_unique'
    add_index :spree_commission_rates, [:enabled, :priority], order: { enabled: :desc, priority: :desc }
    add_index :spree_commission_rates, :deleted_at

    # ──────────────── CommissionRule (targeting) ────────────────
    create_table :spree_commission_rules do |t|
      t.references :commission_rate, null: false, foreign_key: { to_table: :spree_commission_rates }, index: true
      t.references :subject,         null: true,  polymorphic: true, index: true  # Spree::Product | Spree::Taxon | Spree::Vendor
      t.timestamps
    end

    add_index :spree_commission_rules, [:commission_rate_id, :subject_type, :subject_id],
              unique: true, name: 'idx_commission_rules_rate_subject_unique'

    # ──────────────── CommissionLine (frozen snapshot per line item) ────────────────
    create_table :spree_commission_lines do |t|
      t.string   :prefix_id, null: false
      t.references :order,          null: false, foreign_key: { to_table: :spree_orders },  index: true
      t.references :vendor,         null: false, foreign_key: { to_table: :spree_vendors }, index: true
      t.references :line_item,                   foreign_key: { to_table: :spree_line_items }, index: true
      t.references :fulfillment,                  foreign_key: { to_table: :spree_shipments }, index: true  # renamed from shipment in 6.0
      t.references :commission_rate,              foreign_key: { to_table: :spree_commission_rates }, index: true, null: true  # nullable if rule deleted later
      t.string   :rate_snapshot,    null: false # snapshot of rate value at sale time
      t.string   :kind,             null: false # 'percentage' | 'fixed'
      t.decimal  :amount,           null: false, precision: 10, scale: 2
      t.decimal  :tax_amount,       null: false, precision: 10, scale: 2, default: 0.0
      t.decimal  :total,            null: false, precision: 10, scale: 2
      t.string   :currency,         null: false, default: 'BRL'
      t.timestamps
      t.datetime :deleted_at
    end

    add_index :spree_commission_lines, :prefix_id, unique: true
    add_index :spree_commission_lines, :deleted_at

    # CHECK constraint: exactly one of line_item / fulfillment is set
    add_check_constraint :spree_commission_lines,
      "(line_item_id IS NOT NULL AND fulfillment_id IS NULL) OR (line_item_id IS NULL AND fulfillment_id IS NOT NULL)",
      name: 'chk_commission_lines_one_of_line_item_or_fulfillment'
  end
end
