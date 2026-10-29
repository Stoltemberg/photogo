# frozen_string_literal: true

# Migration: create spree_order_groups table
#
# Transaction container — N orders placed together as one customer checkout.
# Domain-neutral: multi-vendor is its first consumer, but it's reused for
# split-by-location, split-by-availability, B2B split-by-company-location.
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md` — Decision 8:
# The group is vendor-agnostic. `vendor` lives on the child Order.

class CreateSpreeOrderGroups < ActiveRecord::Migration[7.2]
  def change
    create_table :spree_order_groups do |t|
      t.string   :number,                    null: false
      t.string   :currency,                  null: false, default: 'BRL'
      t.string   :email                            # guest checkouts have no customer; group carries email
      t.references :store,  null: false, foreign_key: { to_table: :spree_stores }, index: true
      t.references :customer,                        foreign_key: { to_table: :spree_users }, index: true

      # Shared address references (per child order overrides via Order-specific address)
      t.references :ship_address,                   foreign_key: { to_table: :spree_addresses }, index: true
      t.references :bill_address,                   foreign_key: { to_table: :spree_addresses }, index: true

      t.datetime :deleted_at
      t.timestamps
    end

    add_index :spree_order_groups, :number, unique: true
    add_index :spree_order_groups, :deleted_at
  end
end
