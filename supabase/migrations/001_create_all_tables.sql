-- ============================================================
-- DupDetect - Full Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. QUICKBOOKS CONNECTIONS
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT,
  company_name TEXT,
  realm_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qb_connections_user ON quickbooks_connections (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_qb_connections_realm ON quickbooks_connections (realm_id);

-- 3. XERO CONNECTIONS
CREATE TABLE IF NOT EXISTS xero_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id TEXT,
  tenant_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xero_connections_user ON xero_connections (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_xero_connections_tenant ON xero_connections (tenant_id);

-- 4. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  description TEXT,
  details TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  scan_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);

-- 5. ACTIVITY HISTORY
CREATE TABLE IF NOT EXISTS activity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  target_id TEXT,
  target_type TEXT,
  summary TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_history_user ON activity_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_type ON activity_history (action_type);

-- 6. EXPORT HISTORY
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  scope TEXT,
  filter_params JSONB,
  row_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history (user_id, created_at DESC);

-- 7. SETTINGS AUDIT
CREATE TABLE IF NOT EXISTS settings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  modified_by UUID,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settings_audit_user ON settings_audit (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_audit_key ON settings_audit (setting_key);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- 9. SCAN SCHEDULES
CREATE TABLE IF NOT EXISTS scan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quickbooks_connection_id UUID REFERENCES quickbooks_connections(id) ON DELETE SET NULL,
  xero_connection_id UUID REFERENCES xero_connections(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  time_of_day TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scan_schedules_active ON scan_schedules (is_active);

-- 10. SCAN HISTORY
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quickbooks_connection_id UUID,
  scan_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'running',
  total_transactions INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  duplicates_resolved INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_status ON scan_history (status);

-- 11. DUPLICATE TRANSACTIONS
CREATE TABLE IF NOT EXISTS duplicate_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scan_history(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_transaction_id TEXT,
  duplicate_transaction_id TEXT,
  transaction_type TEXT,
  amount NUMERIC(12,2),
  transaction_date TIMESTAMPTZ,
  vendor_name TEXT,
  description TEXT,
  confidence_score NUMERIC(3,2),
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_duplicate_tx_user ON duplicate_transactions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_duplicate_tx_scan ON duplicate_transactions (scan_id);

-- 12. UNDO HISTORY
CREATE TABLE IF NOT EXISTS undo_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duplicate_id UUID REFERENCES duplicate_transactions(id) ON DELETE SET NULL,
  original_transaction_id TEXT,
  duplicate_transaction_id TEXT,
  action_type TEXT NOT NULL,
  reason TEXT,
  undone_by UUID,
  batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_undo_history_user ON undo_history (user_id, created_at DESC);

-- 13. UNDO BATCH QUEUE
CREATE TABLE IF NOT EXISTS undo_batch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duplicate_ids JSONB NOT NULL,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. USER LAST ACTION
CREATE TABLE IF NOT EXISTS user_last_action (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_action_type TEXT,
  last_action_id TEXT,
  can_undo BOOLEAN DEFAULT FALSE,
  last_action_at TIMESTAMPTZ DEFAULT now()
);
