# frozen_string_literal: true

class AddProductTypeAndPhotoMetadata < ActiveRecord::Migration[7.2]
  def up
    # 1. Add product_type column (enum stored as varchar)
    add_column :spree_products, :product_type, :string, null: false, default: 'digital_photo'
    add_index  :spree_products, :product_type

    # 2. Add resolution columns (useful for filtering + quick display)
    add_column :spree_products, :resolution_width,  :integer
    add_column :spree_products, :resolution_height, :integer
    add_column :spree_products, :dpi,              :integer, default: 72
    add_column :spree_products, :color_space,      :string

    # 3. EXIF metadata lives in JSONB (flexible, no schema migration needed for new fields)
    #    store_accessor :exif_data maps these keys to the exif_data column
    add_column :spree_products, :exif_data, :jsonb, default: {}

    # 4. Release flags
    add_column :spree_products, :model_release_signed,    :boolean, default: false
    add_column :spree_products, :property_release_signed, :boolean, default: false
    add_column :spree_products, :ai_generated,            :boolean, default: false
    add_column :spree_products, :royalty_free,             :boolean, default: false
    add_column :spree_products, :editorial_use_only,       :boolean, default: false

    # 5. GPS / Location
    add_column :spree_products, :gps_latitude,  :decimal, precision: 10, scale: 6
    add_column :spree_products, :gps_longitude, :decimal, precision: 10, scale: 6
    add_column :spree_products, :location_name, :string

    # 6. License reference (FK to license type, nil for simple digital photo)
    add_column :spree_products, :license_details, :text

    add_index :spree_products, :gps_latitude
    add_index :spree_products, :gps_longitude
    add_index :spree_products, :ai_generated
    add_index :spree_products, :license_details
  end

  def down
    remove_column :spree_products, :license_details
    remove_column :spree_products, :location_name
    remove_column :spree_products, :gps_longitude
    remove_column :spree_products, :gps_latitude
    remove_column :spree_products, :editorial_use_only
    remove_column :spree_products, :royalty_free
    remove_column :spree_products, :ai_generated
    remove_column :spree_products, :property_release_signed
    remove_column :spree_products, :model_release_signed
    remove_column :spree_products, :exif_data
    remove_column :spree_products, :color_space
    remove_column :spree_products, :dpi
    remove_column :spree_products, :resolution_height
    remove_column :spree_products, :resolution_width
    remove_column :spree_products, :product_type
  end
end
