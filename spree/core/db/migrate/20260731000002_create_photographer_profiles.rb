# frozen_string_literal: true

class CreatePhotographerProfiles < ActiveRecord::Migration[7.2]
  def up
    create_table :photo_photographer_profiles do |t|
      t.references :vendor,     null: false, foreign_key: { to_table: :spree_vendors }, index: { unique: true }
      t.string     :prefix_id,  null: false

      t.string     :verification_status, null: false, default: 'pending'
      t.text       :about

      # Specialties stored as JSON array: ["landscape", "portrait", "street"]
      t.jsonb      :specialties_json, default: []

      # Social links
      t.jsonb      :links, default: {}

      t.timestamps
    end

    add_index :photo_photographer_profiles, :prefix_id, unique: true
    add_index :photo_photographer_profiles, :verification_status
    add_index :photo_photographer_profiles, :specialties_json, using: :gin
  end

  def down
    drop_table :photo_photographer_profiles
  end
end
