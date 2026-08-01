# frozen_string_literal: true

# Fase 3 — Entrega Digital & Licenciamento
#
# Creates three tables:
#   photo_licenses           — license tier, territory, nonce, certificate_hash
#   photo_digital_deliveries — order+asset+license container
#   photo_download_links     — token-gated, expiring, rate-limited download URLs
#
# Order of creation matters for FKs:
#   1. photo_licenses           (no FK dependencies)
#   2. photo_digital_deliveries  (FK to spree_orders, spree_assets, photo_licenses)
#   3. photo_download_links      (FK to photo_digital_deliveries)

class CreatePhotoDeliveryTables < ActiveRecord::Migration[7.2]
  def up
    # ──── 1. Licenses ────
    create_table :photo_licenses do |t|
      t.references :product, null: false, foreign_key: { to_table: :spree_products }, index: true
      t.references :vendor,  null: false, foreign_key: { to_table: :spree_vendors },   index: true
      t.string     :prefix_id,   null: false

      # Tier: personal | commercial | editorial | exclusive | extended
      t.string     :license_type, null: false, default: 'personal'

      # Territory & duration
      t.string     :territory,    null: false, default: 'worldwide'
      t.date       :valid_from
      t.date       :valid_until            # nil = unlimited

      # Pricing multiplier relative to base price (1x, 2x, 3x, 5x, 10x)
      t.decimal    :price_multiplier, precision: 5, scale: 2, default: 1.0

      # Authenticity — nonce prevents hash collision across re-issues
      t.string     :nonce,         null: false, default: -> { 'gen_random_uuid()' }

      # SHA-256 of asset_checksum:nonce — populated on certificate generation
      t.string     :certificate_hash

      t.jsonb      :metadata, default: {}
      t.timestamps
    end

    add_index :photo_licenses, :prefix_id,        unique: true
    add_index :photo_licenses, :license_type
    add_index :photo_licenses, :certificate_hash
    add_index :photo_licenses, :nonce

    # ──── 2. Digital Deliveries ────
    create_table :photo_digital_deliveries do |t|
      t.references :order,   null: false, foreign_key: { to_table: :spree_orders },  index: true
      t.references :asset,   null: false, foreign_key: { to_table: :spree_assets }, index: true
      t.references :license, null: false, foreign_key: { to_table: :photo_licenses }, index: true
      t.string     :prefix_id,   null: false

      # Delivery state: pending → delivered → expired → revoked
      t.string     :status,      null: false, default: 'pending'

      # Configurable per-delivery limits
      t.integer    :max_downloads, null: false, default: 3
      t.integer    :download_ttl_hours, null: false, default: 24

      # Tracking
      t.datetime   :delivered_at
      t.datetime   :expires_at   # computed: delivered_at + download_ttl_hours

      t.timestamps
    end

    add_index :photo_digital_deliveries, :prefix_id,  unique: true
    add_index :photo_digital_deliveries, :status
    add_index :photo_digital_deliveries, :order_id

    # ──── 3. Download Links ────
    create_table :photo_download_links do |t|
      t.references :digital_delivery, null: false,
        foreign_key: { to_table: :photo_digital_deliveries }, index: true
      t.string     :prefix_id,   null: false

      # Token-gated access — URL-safe, 32 bytes
      t.string     :token,       null: false

      # Signed S3 URL (pre-computed at creation time)
      t.text        :signed_url

      # Expiry & limits
      t.datetime    :expires_at,  null: false
      t.integer     :max_downloads, null: false, default: 3
      t.integer     :download_count, null: false, default: 0

      # Audit trail — who downloaded, when, from where
      t.string     :ip_address
      t.string     :user_agent
      t.jsonb      :download_logs, default: []  # [{ip, ua, at}]

      t.datetime   :last_downloaded_at

      t.timestamps
    end

    add_index :photo_download_links, :prefix_id,  unique: true
    add_index :photo_download_links, :token,       unique: true
    add_index :photo_download_links, :expires_at
    add_index :photo_download_links, :digital_delivery_id
  end

  def down
    drop_table :photo_download_links
    drop_table :photo_digital_deliveries
    drop_table :photo_licenses
  end
end
