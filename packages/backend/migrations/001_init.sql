-- PayTray Database Initialization Script
-- Run this once to set up the database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  wallet_type VARCHAR(50) DEFAULT 'injected',
  ens_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================================================
-- PROFILES TABLE (Ceramic-backed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ceramic_did TEXT UNIQUE,
  ceramic_stream_id TEXT,
  name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  expertise TEXT[], -- Array of skills/expertise
  hourly_rate DECIMAL(10, 2),
  is_public BOOLEAN DEFAULT false,
  fallback_storage VARCHAR(50) DEFAULT 'ceramic', -- 'ceramic' | 'ipfs' | 'postgresql'
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'syncing' | 'synced' | 'error'
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_ceramic_did ON profiles(ceramic_did);
CREATE INDEX idx_profiles_public ON profiles(is_public);

-- ============================================================================
-- PAYMENT STREAMS TABLE (Sablier-backed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id BIGINT, -- Sablier stream ID
  token_address VARCHAR(255),
  token_symbol VARCHAR(10),
  amount DECIMAL(20, 8),
  amount_withdrawn DECIMAL(20, 8) DEFAULT 0,
  start_time TIMESTAMP,
  stop_time TIMESTAMP,
  duration_seconds BIGINT,
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'paused' | 'cancelled' | 'completed'
  fallback_type VARCHAR(50) DEFAULT 'sablier', -- 'sablier' | 'simple' | 'mock'
  blockchain VARCHAR(50) DEFAULT 'ethereum', -- 'ethereum' | 'arbitrum' | 'optimism'
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_streams_sender ON payment_streams(sender_id);
CREATE INDEX idx_streams_recipient ON payment_streams(recipient_id);
CREATE INDEX idx_streams_stream_id ON payment_streams(stream_id);
CREATE INDEX idx_streams_status ON payment_streams(status);

-- ============================================================================
-- VIDEO CALLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  livekit_room_name VARCHAR(255),
  livekit_token TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  recorded BOOLEAN DEFAULT false,
  recording_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'active' | 'completed' | 'cancelled'
  fallback_mode VARCHAR(50) DEFAULT 'livekit', -- 'livekit' | 'mock'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calls_initiator ON video_calls(initiator_id);
CREATE INDEX idx_calls_recipient ON video_calls(recipient_id);
CREATE INDEX idx_calls_status ON video_calls(status);
CREATE INDEX idx_calls_created ON video_calls(created_at);

-- ============================================================================
-- WALLET CONNECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_type VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_user ON wallet_connections(user_id);
CREATE INDEX idx_wallets_address ON wallet_connections(wallet_address);

-- ============================================================================
-- MESSAGE QUEUE JOBS TABLE (for persistence and monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS queue_jobs (
  id SERIAL PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  queue_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  data JSONB,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP
);

CREATE INDEX idx_jobs_status ON queue_jobs(status);
CREATE INDEX idx_jobs_queue ON queue_jobs(queue_name);
CREATE INDEX idx_jobs_created ON queue_jobs(created_at);

-- ============================================================================
-- RATE LIMIT TRACKING (optional, if using PostgreSQL instead of Redis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  window_start TIMESTAMP NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(key, window_start)
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- ============================================================================
-- AUDIT LOG TABLE (for compliance and debugging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name VARCHAR(100) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_event ON analytics_events(event_name);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- ============================================================================
-- SCHEMA MIGRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mark this initialization as a migration
INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON payment_streams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres;

