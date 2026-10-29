# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::License, type: :model do
  let(:product) { create(:product, product_type: 'license') }
  let(:vendor)  { create(:vendor) }
  let(:license) { build(:license, product: product, vendor: vendor, license_type: 'commercial') }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(license).to be_valid
    end

    it 'requires a valid license_type' do
      license.license_type = 'invalid_type'
      expect(license).not_to be_valid
    end

    it 'requires territory' do
      license.territory = nil
      expect(license).not_to be_valid
    end

    it 'requires valid_until >= valid_from' do
      license.valid_from  = Date.current + 10.days
      license.valid_until = Date.current
      expect(license).not_to be_valid
      expect(license.errors[:valid_until]).to include('must be after valid_from')
    end
  end

  describe 'enums' do
    it 'defaults to personal' do
      license = build(:license, product: product, vendor: vendor, license_type: nil)
      license.valid?
      expect(license.license_type).to eq('personal')
    end

    it 'supports all 5 tiers' do
      Photo::License::LICENSE_TYPES.each do |type|
        license = build(:license, product: product, vendor: vendor, license_type: type)
        expect(license).to be_valid, "#{type} should be valid"
      end
    end
  end

  describe 'callbacks' do
    it 'sets a nonce on create' do
      license.save!
      expect(license.nonce).to be_present
      expect(license.nonce.length).to be >= 32
    end

    it 'sets price_multiplier from LICENSE_TYPES' do
      license.license_type = 'exclusive'
      license.save!
      expect(license.price_multiplier).to eq(10.0)
    end
  end

  describe '#price_for' do
    it 'calculates price based on base and multiplier' do
      license.license_type = 'commercial'
      license.price_multiplier = 3.0
      expect(license.price_for(99.90)).to eq(299.70)
    end
  end

  describe '#description' do
    it 'returns human-readable description per tier' do
      license.license_type = 'personal'
      expect(license.description).to include('pessoal')

      license.license_type = 'exclusive'
      expect(license.description).to include('exclusivos')
    end
  end

  describe '#currently_valid?' do
    it 'returns true when within valid period' do
      license.valid_from  = Date.current - 5.days
      license.valid_until = Date.current + 5.days
      expect(license.currently_valid?).to be true
    end

    it 'returns false before valid_from' do
      license.valid_from  = Date.current + 5.days
      license.valid_until = Date.current + 10.days
      expect(license.currently_valid?).to be false
    end

    it 'returns false after valid_until' do
      license.valid_from  = Date.current - 10.days
      license.valid_until = Date.current - 5.days
      expect(license.currently_valid?).to be false
    end

    it 'returns true when both dates are nil (unlimited)' do
      license.valid_from  = nil
      license.valid_until = nil
      expect(license.currently_valid?).to be true
    end
  end

  describe '#compute_certificate_hash' do
    it 'returns nil when asset has no checksum' do
      expect(license.compute_certificate_hash(nil)).to be_nil
    end

    it 'returns a SHA-256 hex string when asset has checksum' do
      asset = double('Asset')
      allow(asset).to receive_message_chain(:file, :blob, :checksum).and_return('abc123')
      hash = license.compute_certificate_hash(asset)
      expect(hash).to be_a(String)
      expect(hash.length).to eq(64)    # SHA-256 = 64 hex chars
    end

    it 'produces different hashes for different nonces' do
      license.save!
      asset = double('Asset')
      allow(asset).to receive_message_chain(:file, :blob, :checksum).and_return('checksum123')

      hash1 = license.compute_certificate_hash(asset)
      license2 = create(:license, product: product, vendor: vendor, nonce: 'different_nonce')
      hash2 = license2.compute_certificate_hash(asset)

      expect(hash1).not_to eq(hash2)
    end
  end
end
