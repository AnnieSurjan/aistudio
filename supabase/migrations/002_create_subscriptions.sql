-- ============================================================
-- DupDetect - Paddle Subscriptions Schema
-- Run this in Supabase SQL Editor after 001_create_all_tables.sql
-- ============================================================

-- 15. SUBSCRIPTIONS (Paddle Billing)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  paddle_subscription_id TEXT UNIQUE,
  paddle_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'Starter' CHECK (plan IN ('Starter', 'Professional', 'Enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'paused', 'past_due', 'canceled')),
  paddle_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_effective_date TIMESTAMPTZ,
  update_url TEXT,
  cancel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle ON subscriptions (paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions (paddle_customer_id);

-- 16. PADDLE EVENTS (webhook event log for idempotency & debugging)
CREATE TABLE IF NOT EXISTS paddle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paddle_events_type ON paddle_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paddle_events_processed ON paddle_events (processed);

-- Add plan column to users table for quick lookups
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Starter' CHECK (plan IN ('Starter', 'Professional', 'Enterprise'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;
