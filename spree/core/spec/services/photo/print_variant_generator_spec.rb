# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::PrintVariantGenerator do
  let(:product) { create(:product, product_type: 'print', sku: 'PHOTO-008') }
  let!(:default_variant) { create(:variant, product: product, price: 200.0) }

  describe '#generate!' do
    it 'creates variants for each size × paper × frame combination' do
      generator = described_class.new(product,
        sizes: %w[A4 A3],
        paper_types: %w[matte glossy],
        frames: %w[none]
      )

      variants = generator.generate!
      # 2 sizes × 2 papers × 1 frame = 4 variants
      expect(variants.size).to eq(4)
      expect(variants).to all(be_persisted)
    end

    it 'assigns correct SKU to each variant' do
      generator = described_class.new(product, sizes: ['A4'], paper_types: ['glossy'], frames: ['none'])
      variant = generator.generate!.first
      expect(variant.sku).to eq('PHOTO-008-A4-glossy')
    end

    it 'calculates price based on size/paper/frame multiplier' do
      generator = described_class.new(product, sizes: ['A1'], paper_types: ['canvas'], frames: ['black'])
      variant = generator.generate!.first
      # A1 4.0 × canvas 2.2 × black 1.3 = 11.44 × 200 = 2288.00
      expect(variant.price).to eq(2288.00)
    end

    it 'reuses existing variants instead of creating duplicates' do
      generator = described_class.new(product, sizes: %w[A4 A3], paper_types: %w[matte], frames: %w[none])
      first_run = generator.generate!
      second_run = generator.generate!

      expect(Spree::Variant.where(product: product).count).to eq(3) # 2 variants + master
      expect(first_run.map(&:id)).to match_array(second_run.map(&:id))
    end

    it 'rejects non-print products' do
      digital = create(:product, product_type: 'digital_photo')
      generator = described_class.new(digital, sizes: ['A4'])
      expect { generator.generate! }.to raise_error(ArgumentError, /print/)
    end

    it 'respects custom size/paper/frame selection' do
      generator = described_class.new(
        product,
        sizes: ['30x40cm'],
        paper_types: ['fine_art', 'matte'],
        frames: ['natural_oak', 'black']
      )
      variants = generator.generate!
      expect(variants.size).to eq(4)
    end
  end
end