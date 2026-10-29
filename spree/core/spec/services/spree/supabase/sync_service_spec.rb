# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Spree::Supabase::SyncService, type: :service do
  let(:user) { create(:user, email: 'test@example.com', name: 'Test User') }
  let(:vendor) { create(:vendor, user: user, name: 'Test Vendor') }

  before do
    # Mock Supabase admin client
    allow(Spree::Supabase).to receive(:admin_ready?).and_return(true)
    allow(Spree::Supabase).to receive(:admin_client).and_return(double('SupabaseClient'))
  end

  describe '.sync_user' do
    context 'when user does not exist in Supabase' do
      it 'creates user in Supabase' do
        allow(Spree::Supabase).to receive(:find_supabase_user_by_email).and_return(nil)
        allow(Spree::Supabase).to receive(:create_user).and_return({
          'user' => { 'id' => 'supabase-user-123' }
        })

        result = described_class.sync_user(user)

        expect(result[:status]).to eq('created')
        expect(result[:user_id]).to eq('supabase-user-123')
      end
    end

    context 'when user already exists in Supabase' do
      it 'updates user metadata' do
        allow(Spree::Supabase).to receive(:find_supabase_user_by_email).and_return({ 'id' => 'supabase-user-123' })
        allow(Spree::Supabase).to receive(:update_user_metadata).and_return({})

        result = described_class.sync_user(user)

        expect(result[:status]).to eq('updated')
        expect(result[:user_id]).to eq('supabase-user-123')
      end
    end

    context 'when Supabase not configured' do
      it 'returns error' do
        allow(Spree::Supabase).to receive(:admin_ready?).and_return(false)

        result = described_class.sync_user(user)
        expect(result[:error]).to eq('Supabase not configured')
      end
    end
  end

  describe '.sync_vendor' do
    it 'syncs vendor with user metadata' do
      allow(Spree::Supabase).to receive(:find_supabase_user_by_email).and_return(nil)
      allow(Spree::Supabase).to receive(:create_user).and_return({
        'user' => { 'id' => 'supabase-user-456' }
      })

      result = described_class.sync_vendor(vendor)

      expect(result[:status]).to eq('created')
      expect(result[:user_id]).to eq('supabase-user-456')
    end

    it 'returns error if vendor has no user' do
      vendor_without_user = build(:vendor, user: nil)
      result = described_class.sync_vendor(vendor_without_user)
      expect(result[:error]).to eq('Vendor has no associated user')
    end
  end

  describe '.handle_webhook' do
    it 'handles user.created event' do
      payload = {
        type: 'user.created',
        record: { email: 'new@example.com', user_metadata: { full_name: 'New User' } }
      }

      allow(Spree::Supabase::SyncService).to receive(:sync_from_supabase).and_return({
        status: 'created', user_id: 1
      })

      result = described_class.handle_webhook(payload)
      expect(result[:status]).to eq('created')
    end

    it 'handles user.updated event' do
      payload = {
        type: 'user.updated',
        record: { email: 'existing@example.com', user_metadata: { full_name: 'Updated' } }
      }

      allow(Spree::Supabase::SyncService).to receive(:sync_from_supabase).and_return({
        status: 'updated', user_id: 1
      })

      result = described_class.handle_webhook(payload)
      expect(result[:status]).to eq('updated')
    end

    it 'handles user.deleted event' do
      payload = { type: 'user.deleted', record: { email: 'delete@example.com' } }

      allow(Spree::Supabase::SyncService).to receive(:delete_from_supabase).and_return({
        status: 'soft_deleted', user_id: 1
      })

      result = described_class.handle_webhook(payload)
      expect(result[:status]).to eq('soft_deleted')
    end

    it 'ignores unknown events' do
      payload = { type: 'unknown.event', record: {} }
      result = described_class.handle_webhook(payload)
      expect(result[:status]).to eq('ignored')
    end
  end

  describe '.sync_subscription' do
    let(:subscription) do
      create(:subscription,
        user: user,
        plan: create(:plan, slug: 'pro'),
        status: 'active',
        external_id: 'sub_123',
        provider: 'mercado_pago'
      )
    end

    it 'updates user metadata with subscription info' do
      allow(Spree::Supabase).to receive(:find_supabase_user_by_email).and_return({ 'id' => 'supabase-user-789' })
      allow(Spree::Supabase).to receive(:update_user_metadata).and_return({})

      result = described_class.sync_subscription(user, subscription)
      expect(result[:status]).to eq('synced')
    end
  end
end