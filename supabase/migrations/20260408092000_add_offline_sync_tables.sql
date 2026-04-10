/*
  Offline Sync Support Tables & Indexes Optimization
  
  This migration optimizes tables for offline-first sync:
  1. Adds sync metadata to existing tables
  2. Creates sync history tracking
  3. Adds performance indexes
  4. Sets up real-time subscriptions
*/

-- ============================================
-- SYNC METADATA (Track sync status per user per table)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  last_sync_token TEXT,
  sync_count INTEGER DEFAULT 0,
  conflict_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_sync_metadata_unique 
  ON sync_metadata(user_id, table_name);
CREATE INDEX idx_sync_metadata_user ON sync_metadata(user_id);
CREATE INDEX idx_sync_metadata_last_synced ON sync_metadata(last_synced_at DESC);

-- ============================================
-- SYNC HISTORY (Audit trail of all syncs)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'FULL_SYNC')),
  record_id UUID,
  records_affected INTEGER DEFAULT 1,
  duration_ms INTEGER,
  conflict_occurred BOOLEAN DEFAULT false,
  error_occurred BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_history_user ON sync_history(user_id);
CREATE INDEX idx_sync_history_table ON sync_history(table_name);
CREATE INDEX idx_sync_history_created ON sync_history(created_at DESC);
CREATE INDEX idx_sync_history_conflicts ON sync_history(conflict_occurred) 
  WHERE conflict_occurred = true;

-- ============================================
-- OFFLINE CACHE METADATA (Track what's cached locally)
-- ============================================
CREATE TABLE IF NOT EXISTS offline_cache_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  cached_records_count INTEGER DEFAULT 0,
  cache_size_bytes INTEGER DEFAULT 0,
  last_cached_at TIMESTAMPTZ,
  is_complete_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_offline_cache_metadata_unique 
  ON offline_cache_metadata(user_id, table_name);

-- ============================================
-- VERSION TRACKING (For conflict resolution)
-- ============================================
CREATE TABLE IF NOT EXISTS record_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  version_number INTEGER DEFAULT 1,
  user_id UUID NOT NULL REFERENCES users(id),
  change_type TEXT CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE')),
  previous_value JSONB,
  new_value JSONB NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_record_versions_record ON record_versions(record_id);
CREATE INDEX idx_record_versions_table ON record_versions(table_name);
CREATE INDEX idx_record_versions_user ON record_versions(user_id);
CREATE INDEX idx_record_versions_created ON record_versions(created_at DESC);

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Add sync_status index for better offline query filtering
CREATE INDEX IF NOT EXISTS idx_diary_entries_sync_status 
  ON diary_entries(sync_status) WHERE sync_status != 'synced';

CREATE INDEX IF NOT EXISTS idx_messages_sync_status 
  ON messages(sync_status) WHERE sync_status != 'synced';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_child_enrollments_teacher_active 
  ON child_enrollments(teacher_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_child_enrollments_parent_active 
  ON child_enrollments(parent_id) WHERE status = 'active';

-- Connection request filters
CREATE INDEX IF NOT EXISTS idx_connection_requests_pending 
  ON connection_requests(status) WHERE status = 'pending';

-- Unread messages
CREATE INDEX IF NOT EXISTS idx_message_threads_unread 
  ON message_threads(is_archived) WHERE is_archived = false;

-- ============================================
-- MATERIALIZED VIEWS (For complex queries)
-- ============================================

-- View: User connections (who can see what data)
CREATE OR REPLACE VIEW user_connections AS
SELECT 
  er.from_user_id as requester_id,
  er.to_user_id as recipient_id,
  er.status,
  er.child_id,
  u1.name as requester_name,
  u2.name as recipient_name,
  er.created_at
FROM connection_requests er
JOIN users u1 ON u1.id = er.from_user_id
JOIN users u2 ON u2.id = er.to_user_id
WHERE er.status = 'accepted';

-- View: Active enrollments for quick lookups
CREATE OR REPLACE VIEW active_enrollments AS
SELECT 
  ce.id,
  ce.child_id,
  c.name as child_name,
  ce.teacher_id,
  tp.user_id as teacher_user_id,
  tu.name as teacher_name,
  ce.parent_id,
  pp.user_id as parent_user_id,
  pu.name as parent_name,
  ce.class_year
FROM child_enrollments ce
JOIN child_profiles c ON c.id = ce.child_id
JOIN teacher_profiles tp ON tp.id = ce.teacher_id
JOIN parent_profiles pp ON pp.id = ce.parent_id
JOIN users tu ON tu.id = tp.user_id
JOIN users pu ON pu.id = pp.user_id
WHERE ce.status = 'active';

-- View: Pending sync operations (for background syncer)
CREATE OR REPLACE VIEW pending_sync_operations AS
SELECT 
  sq.id,
  sq.user_id,
  sq.table_name,
  sq.operation,
  sq.record_id,
  sq.created_at,
  sq.attempt_count,
  CASE 
    WHEN sq.attempt_count > 3 THEN 'urgent'
    WHEN sq.attempt_count > 1 THEN 'high'
    ELSE 'normal'
  END as priority
FROM sync_queue sq
WHERE sq.status IN ('pending', 'failed')
ORDER BY sq.attempt_count DESC, sq.created_at ASC;

-- ============================================
-- HELPER FUNCTIONS FOR OFFLINE SYNC
-- ============================================

-- Function to mark all user changes as synced
CREATE OR REPLACE FUNCTION mark_user_changes_as_synced(p_user_id UUID)
RETURNS TABLE (table_name TEXT, records_synced BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH updates AS (
    UPDATE sync_queue 
    SET status = 'synced', updated_at = now()
    WHERE user_id = p_user_id AND status IN ('pending', 'syncing')
    RETURNING table_name, COUNT(*) as count
  )
  SELECT updates.table_name, updates.count
  FROM updates
  GROUP BY updates.table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to add conflict to queue item
CREATE OR REPLACE FUNCTION add_conflict_to_queue(
  p_queue_id UUID,
  p_record_id UUID,
  p_table_name TEXT,
  p_local_version JSONB,
  p_remote_version JSONB,
  p_server_version JSONB
)
RETURNS UUID AS $$
DECLARE
  v_conflict_id UUID;
BEGIN
  INSERT INTO sync_conflicts (
    sync_queue_id, record_id, table_name, 
    local_version, remote_version, server_version
  ) VALUES (
    p_queue_id, p_record_id, p_table_name,
    p_local_version, p_remote_version, p_server_version
  )
  RETURNING id INTO v_conflict_id;
  
  -- Update sync_queue to mark as conflicted
  UPDATE sync_queue SET status = 'failed' WHERE id = p_queue_id;
  
  RETURN v_conflict_id;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve conflict
CREATE OR REPLACE FUNCTION resolve_conflict(
  p_conflict_id UUID,
  p_resolution_type TEXT,
  p_resolved_value JSONB,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE sync_conflicts 
  SET 
    resolution_type = p_resolution_type,
    resolved_value = p_resolved_value,
    resolved_at = now(),
    resolved_by = p_user_id
  WHERE id = p_conflict_id;
  
  -- Re-queue the operation after resolution
  UPDATE sync_queue 
  SET status = 'pending'
  WHERE id = (
    SELECT sync_queue_id FROM sync_conflicts WHERE id = p_conflict_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to log sync operation
CREATE OR REPLACE FUNCTION log_sync_operation(
  p_user_id UUID,
  p_table_name TEXT,
  p_operation TEXT,
  p_record_id UUID,
  p_duration_ms INTEGER,
  p_conflict_occurred BOOLEAN,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO sync_history (
    user_id, table_name, operation, record_id,
    duration_ms, conflict_occurred, error_occurred, error_message
  ) VALUES (
    p_user_id, p_table_name, p_operation, p_record_id,
    p_duration_ms, p_conflict_occurred, 
    COALESCE(p_error_message IS NOT NULL, false),
    p_error_message
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get sync status for user
CREATE OR REPLACE FUNCTION get_sync_status(p_user_id UUID)
RETURNS TABLE (
  pending_items BIGINT,
  failed_items BIGINT,
  conflicts BIGINT,
  last_sync TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM sync_queue WHERE user_id = p_user_id AND status = 'pending'),
    (SELECT COUNT(*) FROM sync_queue WHERE user_id = p_user_id AND status = 'failed'),
    (SELECT COUNT(*) FROM sync_conflicts WHERE resolved_at IS NULL),
    (SELECT MAX(last_synced_at) FROM sync_metadata WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER UPDATES FOR NEW TABLES
-- ============================================

CREATE TRIGGER update_sync_metadata_updated_at BEFORE UPDATE ON sync_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_cache_metadata_updated_at BEFORE UPDATE ON offline_cache_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create sync metadata when user is created
CREATE OR REPLACE FUNCTION create_user_sync_metadata()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sync_metadata (user_id, table_name)
  SELECT NEW.id, table_name
  FROM (
    SELECT 'diary_entries' as table_name
    UNION ALL SELECT 'messages'
    UNION ALL SELECT 'announcements'
    UNION ALL SELECT 'connection_requests'
    UNION ALL SELECT 'message_threads'
  ) tables;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_sync_metadata AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_sync_metadata();

-- ============================================
-- GRANTS (For app user - adjust as needed)
-- ============================================

-- If using a limited app user (recommended for Supabase):
-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE sync_queue IS 'Stores pending operations for offline-first sync';
COMMENT ON TABLE sync_conflicts IS 'Tracks conflicts that need user resolution';
COMMENT ON TABLE sync_metadata IS 'Stores last sync timestamps and counters per user per table';
COMMENT ON TABLE record_versions IS 'Maintains version history for conflict detection';
COMMENT ON COLUMN messages.read_by IS 'JSONB storing {user_id: timestamp} of who read message';
COMMENT ON COLUMN diary_entries.sync_status IS 'Track sync status: pending, syncing, synced, or conflict';
