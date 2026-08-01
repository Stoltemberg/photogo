# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Supabase Webhook', type: :request do
  let(:user) { create(:user, email: 'test@example.com') }

  before do
    allow(ENV).to receive(:[]).with('SUPABASE_WEBHOOK_SECRET').and_return('test_secret')
  end

  describe 'POST /api/v3/webhooks/supabase with valid signature' do
    context 'user.created event' do
      it 'syncs user from Supabase to Spree' do
        payload = {
          type: 'user.created',
          record: {
            id: 'supabase-user-123',
            email: 'new@supabase.com',
            user_metadata: { full_name: 'New User' }
          }
        }

        allow(Spree::Supabase::SyncService).to receive(:sync_from_supabase).and_return({
          status: 'created', user_id: 1
        })

        post '/api/v3/webhooks/supabase', params: payload.to_json,
          headers: {
            'Content-Type' => 'application/json',
            'X-Supabase-Signature' => OpenSSL::HMAC.hexdigest('SHA256', 'test_secret', payload.to_json)
          }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['status']).to eq('created')
      end
    end

    context 'user.updated event' do
      it 'updates existing user' do
        payload = {
          type: 'user.updated',
          record: {
            id: 'supabase-user-456',
            email: user.email,
            user_metadata: { full_name: 'Updated Name' }
          }
        }

        allow(Spree::Supabase::SyncService).to receive(:sync_from_supabase).and_return({
          status: 'updated', user_id: user.id
        })

        post '/api/v3/webhooks/supabase', params: payload.to_json,
          headers: {
            'Content-Type' => 'application/json',
            'X-Supabase-Signature' => OpenSSL::HMAC.hexdigest('SHA256', 'test_secret', payload.to_json)
          }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['status']).to eq('updated')
      end
    end

    context 'user.deleted event' do
      it 'soft deletes user in Spree' do
        payload = {
          type: 'user.deleted',
          record: {
            id: 'supabase-user-789',
            email: user.email
          }
        }

        allow(Spree::Supabase::SyncService).to receive(:delete_from_supabase).and_return({
          status: 'soft_deleted', user_id: user.id
        })

        post '/api/v3/webhooks/supabase', params: payload.to_json,
          headers: {
            'Content-Type' => 'application/json',
            'X-Supabase-Signature' => OpenSSL::HMAC.hexdigest('SHA256', 'test_secret', payload.to_json)
          }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['status']).to eq('soft_deleted')
      end
    end
  end

  describe 'POST /api/v3/webhooks/supabase with invalid signature' do
    it 'returns 401 unauthorized' do
      payload = { type: 'user.created', record: { email: 'test@example.com' } }

      post '/api/v3/webhooks/supabase', params: payload.to_json,
        headers: {
          'Content-Type' => 'application/json',
          'X-Supabase-Signature' => 'invalid_signature'
        }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)['status']).to eq('error')
    end
  end

  describe 'POST /api/v3/webhooks/supabase without signature (no secret configured)' do
    before do
      allow(ENV).to receive(:[]).with('SUPABASE_WEBHOOK_SECRET').and_return(nil)
    end

    it 'processes webhook without signature verification' do
      payload = { type: 'user.created', record: { email: 'no@secret.com' } }

      allow(Spree::Supabase::SyncService).to receive(:sync_from_supabase).and_return({
        status: 'created', user_id: 1
      })

      post '/api/v3/webhooks/supabase', params: payload.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:ok)
    end
  end
end