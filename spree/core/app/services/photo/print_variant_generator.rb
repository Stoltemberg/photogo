# frozen_string_literal: true

module Photo
  # Generates variants for print-type products.
  #
  # Given a product with product_type='print', this service generates
  # Spree::Variant records for each combination of:
  #   print_size × paper_type × frame (limited by the vendor's selection)
  #
  # Default PRINTS_SIZES, PAPER_TYPES, and FRAMES are constants.
  # Photographers can limit the matrix via options (e.g. only 3 sizes, 2 papers).
  #
  # Usage:
  #   generator = Photo::PrintVariantGenerator.new(product, sizes: %w[A4 A3 A2], papers: %w[matte glossy])
  #   generator.generate!
  #   # => Creates 3×2×1 = 6 variants (no frame by default)
  #
  class PrintVariantGenerator
    PRINT_SIZES = %w[A4 A3 A2 A1 30x40cm 50x70cm 60x90cm 80x120cm].freeze
    PAPER_TYPES = %w[matte glossy fine_art metallic canvas].freeze
    FRAMES      = %w[none white black natural_oak walnut].freeze

    attr_reader :product, :sizes, :paper_types, :frames

    def initialize(product, sizes: PRINT_SIZES, paper_types: PAPER_TYPES, frames: %w[none])
      @product     = product
      @sizes       = Array(sizes).presence || PRINT_SIZES
      @paper_types = Array(paper_types).presence || PAPER_TYPES
      @frames      = Array(frames).presence || %w[none]
    end

    def generate!
      raise ArgumentError, "Product must be of type 'print'" unless product.print?

      combinations = sizes.product(paper_types, frames)
      variants = []
      base_price = product.default_variant&.price || 99.90

      combinations.each do |(size, paper, frame)|
        sku = build_sku(product, size, paper, frame)
        variant = product.variants.find_or_create_by!(sku: sku) do |v|
          v.price   = calculate_variant_price(base_price, size, paper, frame)
          v.options = { print_size: size, paper_type: paper, frame: frame }
          v.status  = 'active'
        end
        variants << variant
      end

      variants
    end

    private

    def build_sku(product, size, paper, frame)
      base = product.sku || product.prefix_id || product.id.to_s
      frame_suffix = frame == 'none' ? '' : "-#{frame}"
      "#{base}-#{size}-#{paper}#{frame_suffix}"
    end

    def calculate_variant_price(base_price, size, paper, frame)
      multiplier = size_price_multiplier(size) *
                   paper_price_multiplier(paper) *
                   frame_price_multiplier(frame)
      (base_price * multiplier).round(2)
    end

    def size_price_multiplier(size)
      case size
      when 'A4'       then 1.0
      when 'A3'       then 1.5
      when 'A2'       then 2.5
      when 'A1'       then 4.0
      when '30x40cm'  then 1.8
      when '50x70cm'  then 3.0
      when '60x90cm'  then 4.5
      when '80x120cm' then 7.0
      else 1.0
      end
    end

    def paper_price_multiplier(paper)
      case paper
      when 'matte'    then 1.0
      when 'glossy'   then 1.0
      when 'fine_art' then 1.8
      when 'metallic' then 1.6
      when 'canvas'   then 2.2
      else 1.0
      end
    end

    def frame_price_multiplier(frame)
      case frame
      when 'none'          then 1.0
      when 'white'         then 1.3
      when 'black'         then 1.3
      when 'natural_oak'   then 1.8
      when 'walnut'        then 2.0
      else 1.0
      end
    end
  end
end