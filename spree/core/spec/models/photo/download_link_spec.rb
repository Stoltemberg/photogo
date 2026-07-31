# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::DownloadLink, type: :model do
  let(:delivery)   { create(:digital_delivery) }
  let(:link)       { create(:download_link, digital_delivery: delivery, expires_at: 24.hours.from_now, max_downloads: 3) }

  describe 'validations' do
    it 'requires a unique token' do
      expect(link.token).to be_present
      expect(build(:download_link, digital_delivery: delivery, token: link.token)).not_to be_valid
    end

    it 'requires expires_at' do
      expect(build(:download_link, digital_delivery: delivery, expires_at: nil)).not_to be_valid
    end

    it 'requires max_downloads > 0' do
      expect(build(:download_link, digital_delivery: delivery, max_downloads: 0)).not_to be_valid
    end
  end

  describe '#valid?' do
    it 'is valid when not expired and under download limit' do
      expect(link.valid?).to be true
    end

    it 'is invalid when expired by time' do
      link.update!(expires_at: 1.minute.ago)
      expect(link.valid?).to be false
    end

    it 'is invalid when download_count reaches max_downloads' do
      link.update!(download_count: 3)
      expect(link.valid?).to be false
    end

    it 'is invalid when delivery is revoked' do
      delivery.update!(status: 'revoked')
      expect(link.valid?).to be false
    end
  end

  describe '#expired?' do
    it 'returns true when expires_at is in the past' do
      link.update!(expires_at: 1.minute.ago)
      expect(link.expired?).to be true
    end

    it 'returns false when expires_at is in the future' do
      expect(link.expired?).to be false
    end
  end

  describe '#exhausted?' do
    it 'returns true when download_count >= max_downloads' do
      link.update!(download_count: 3, max_downloads: 3)
      expect(link.exhausted?).to be true
    end

    it 'returns false when download_count < max_downloads' do
      expect(link.exhausted?).to be false
    end
  end

  describe '#remaining' do
    it 'returns max_downloads - download_count' do
      link.update!(download_count: 1, max_downloads: 3)
      expect(link.remaining).to eq(2)
    end

    it 'never returns negative' do
      link.update!(download_count: 5, max_downloads: 3)
      expect(link.remaining).to eq(0)
    end
  end

  describe '#record_download!' do
    it 'increments download_count and records IP/UA' do
      result = link.record_download!(ip_address: '192.168.1.1', user_agent: 'Mozilla/5.0')

      expect(result).to be true
      expect(link.download_count).to eq(1)
      expect(link.ip_address).to eq('192.168.1.1')
      expect(link.user_agent).to eq('Mozilla/5.0')
    end

    it 'appends to download_logs' do
      link.record_download!(ip_address: '10.0.0.1', user_agent: 'curl/8')
      link.record_download!(ip_address: '10.0.0.2', user_agent: 'wget/1')

      expect(link.download_logs.size).to eq(2)
      expect(link.download_logs.first['ip']).to eq('10.0.0.1')
      expect(link.download_logs.second['ip']).to eq('10.0.0.2')
    end

    it 'returns false when link is invalid' do
      link.update!(expires_at: 1.minute.ago)
      expect(link.record_download!).to be false
    end

    it 'sets last_downloaded_at' do
      link.record_download!
      expect(link.last_downloaded_at).to be_present
    end
  end
end
