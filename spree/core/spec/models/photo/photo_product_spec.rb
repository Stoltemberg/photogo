# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Photo::PhotoProduct concern', type: :model do
  subject(:product) { build(:product, product_type: 'digital_photo') }

  describe 'product_type enum' do
    it 'defaults to digital_photo' do
      expect(product.digital_photo?).to be true
    end

    it 'supports print type' do
      product.product_type = 'print'
      expect(product.print?).to be true
      expect(product.digital_photo?).to be false
    end

    it 'supports license type' do
      product.product_type = 'license'
      expect(product.license?).to be true
    end

    it 'supports service type' do
      product.product_type = 'service'
      expect(product.service?).to be true
    end

    it 'supports bundle type' do
      product.product_type = 'bundle'
      expect(product.bundle?).to be true
    end

    it 'rejects invalid product type' do
      product.product_type = 'invalid'
      expect(product).not_to be_valid
      expect(product.errors[:product_type]).to include('is not included in the list')
    end
  end

  describe 'exif_data' do
    it 'stores and retrieves camera info' do
      product.update!(
        camera_make: 'Canon',
        camera_model: 'EOS R5',
        lens_model: 'EF24-70mm f/2.8L'
      )

      expect(product.camera_make).to eq('Canon')
      expect(product.camera_model).to eq('EOS R5')
      expect(product.lens_model).to eq('EF24-70mm f/2.8L')
    end

    it 'stores aperture, shutter speed, ISO, focal length' do
      product.update!(aperture: '2.8', shutter_speed: '1/200', iso: '100', focal_length: '85mm')

      expect(product.aperture).to eq('2.8')
      expect(product.shutter_speed).to eq('1/200')
      expect(product.iso).to eq('100')
      expect(product.focal_length).to eq('85mm')
    end

    it '#exif_string returns combined EXIF string' do
      product.update!(camera_make: 'Sony', camera_model: 'A7IV', aperture: '3.5', shutter_speed: '1/4000')

      exif = product.exif_string
      expect(exif).to include('Sony A7IV')
      expect(exif).to include('f/3.5')
      expect(exif).to include('1/4000s')
    end

    it '#exif_summary returns non-nil data only' do
      product.update!(camera_make: 'Nikon', camera_model: 'Z9')
      summary = product.exif_summary
      expect(summary.keys).to include('camera_make', 'camera_model')
      expect(summary.keys).not_to include('shutter_speed')
    end
  end

  describe 'gps coordinates' do
    it 'returns false if no GPS data' do
      expect(product.gps_coordinates?).to be false
    end

    it 'returns coordinates when both fields present' do
      product.update!(gps_latitude: -23.5505, gps_longitude: -46.6333)
      expect(product.gps_coordinates?).to be true
      expect(product.gps_coordinates).to eq([-23.5505, -46.6333])
    end
  end

  describe 'release flags' do
    it 'tracks model release' do
      product.update!(model_release_signed: true)
      expect(product.model_release_signed?).to be true
    end

    it 'tracks property release' do
      product.update!(property_release_signed: true)
      expect(product.property_release_signed?).to be true
    end

    it 'tracks AI generated' do
      product.update!(ai_generated: true)
      expect(product.ai_generated?).to be true
    end
  end

  describe 'resolution' do
    it 'formats resolution with DPI' do
      product.update!(resolution_width: 6000, resolution_height: 4000, dpi: 300)
      expect(product.resolution_string).to eq('6000×4000 @ 300 DPI')
    end

    it 'returns nil without resolution data' do
      expect(product.resolution_string).to be_nil
    end
  end
end