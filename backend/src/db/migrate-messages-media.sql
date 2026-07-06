-- Add media support and message actions to messaging system

-- Add media fields and soft-delete and reply to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS media_url    TEXT,
  ADD COLUMN IF NOT EXISTS media_type   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reply_to_id  UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Add archive per participant to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS archived_by_1 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_by_2 BOOLEAN DEFAULT FALSE;
