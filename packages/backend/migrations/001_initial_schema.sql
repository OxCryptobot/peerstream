-- PayTray Database Schema v1.0
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (core identity)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  wallet_type VARCHAR(50) NOT NULL,
  ens_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT wallet_length CHECK (LENGTH(wallet_address) = 42),
  CONSTRAINT wallet_format CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_wallet_address ON users(wallet_address);
CREATE INDEX idx_created_at ON users(created_at);

-- Profiles table (user information)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(2048),
  expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
  hourly_rate DECIMAL(10, 2),
  social_twitter VARCHAR(255),
  social_github VARCHAR(255),
  social_linkedin VARCHAR(255),
  is_expert BOOLEAN DEFAULT false,
  profile_completeness INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT name_length CHECK (LENGTH(name) BETWEEN 2 AND 255),
  CONSTRAINT bio_length CHECK (LENGTH(bio) <= 1000),
  CONSTRAINT hourly_rate_positive CHECK (hourly_rate > 0)
);

CREATE INDEX idx_user_id_profile ON profiles(user_id);
CREATE INDEX idx_is_expert ON profiles(is_expert);

-- Payment streams table (Sablier integration)
CREATE TABLE payment_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id BIGINT UNIQUE NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  token_symbol VARCHAR(10) NOT NULL,
  amount DECIMAL(28, 8) NOT NULL,
  start_time BIGINT NOT NULL,
  stop_time BIGINT NOT NULL,
  sablier_contract_address VARCHAR(42),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT time_valid CHECK (start_time < stop_time),
  CONSTRAINT token_format CHECK (token_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_sender_id ON payment_streams(sender_id);
CREATE INDEX idx_recipient_id ON payment_streams(recipient_id);
CREATE INDEX idx_status ON payment_streams(status);
CREATE INDEX idx_created_at_streams ON payment_streams(created_at);

-- Video calls table (LiveKit integration)
CREATE TABLE video_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_name VARCHAR(255) UNIQUE NOT NULL,
  caller_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INT,
  recording_url VARCHAR(2048),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_caller_id ON video_calls(caller_id);
CREATE INDEX idx_recipient_id_calls ON video_calls(recipient_id);
CREATE INDEX idx_status_calls ON video_calls(status);

-- Wallet connections table (multi-wallet support)
CREATE TABLE wallet_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  wallet_type VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, wallet_address),
  CONSTRAINT wallet_format_conn CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_user_id_wallets ON wallet_connections(user_id);
CREATE INDEX idx_wallet_address_conn ON wallet_connections(wallet_address);

-- API keys table (backend service authentication)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id_keys ON api_keys(user_id);
CREATE INDEX idx_is_active_keys ON api_keys(is_active);

-- Audit logs table (security & compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_id_audit ON audit_logs(user_id);
CREATE INDEX idx_action_audit ON audit_logs(action);
CREATE INDEX idx_created_at_audit ON audit_logs(created_at);

-- Tokens table (JWT and session management)
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  token_type VARCHAR(50) DEFAULT 'access',
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id_tokens ON tokens(user_id);
CREATE INDEX idx_expires_at ON tokens(expires_at);

-- Rate limits table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  endpoint VARCHAR(255) NOT NULL,
  request_count INT DEFAULT 1,
  reset_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_endpoint_rate ON rate_limits(endpoint);
CREATE INDEX idx_reset_at ON rate_limits(reset_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER streams_updated_at BEFORE UPDATE ON payment_streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add full-text search index for profiles
CREATE INDEX idx_profile_search ON profiles USING GIN (
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(bio, ''))
);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Core user identity and wallet information';
COMMENT ON TABLE profiles IS 'Extended user profile for expert marketplace';
COMMENT ON TABLE payment_streams IS 'Payment stream records from Sablier protocol';
COMMENT ON TABLE video_calls IS 'Video call records for expert meetings';
COMMENT ON TABLE wallet_connections IS 'Multi-wallet support for each user';
COMMENT ON TABLE audit_logs IS 'Security audit trail for compliance';
