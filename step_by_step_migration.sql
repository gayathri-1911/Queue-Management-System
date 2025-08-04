-- Step-by-step migration for Queue Management System
-- Run each section separately in Supabase SQL Editor

-- STEP 1: Add missing columns to existing tokens table
-- Run this first:

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS service_type_id uuid;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS priority_level integer DEFAULT 1;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS estimated_wait_minutes integer;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS no_show_at timestamptz;

-- STEP 2: Update token status enum
-- Run this second:

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'no_show' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'token_status')) THEN
    ALTER TYPE token_status ADD VALUE 'no_show';
  END IF;
END $$;

-- STEP 3: Create service_types table
-- Run this third:

CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  estimated_duration_minutes integer DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage service types for own queues"
  ON service_types
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = service_types.queue_id 
    AND queues.manager_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = service_types.queue_id 
    AND queues.manager_id = auth.uid()
  ));

-- STEP 4: Create queue_settings table
-- Run this fourth:

CREATE TABLE IF NOT EXISTS queue_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  is_paused boolean DEFAULT false,
  pause_reason text,
  auto_serve_enabled boolean DEFAULT false,
  auto_serve_minutes integer DEFAULT 5,
  priority_enabled boolean DEFAULT false,
  max_tokens_per_day integer,
  operating_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage settings for own queues"
  ON queue_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = queue_settings.queue_id 
    AND queues.manager_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = queue_settings.queue_id 
    AND queues.manager_id = auth.uid()
  ));

-- STEP 5: Create notifications table
-- Run this fifth:

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  token_id uuid REFERENCES tokens(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sms', 'email', 'browser', 'system')),
  recipient text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read notifications for own queues"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = notifications.queue_id 
    AND queues.manager_id = auth.uid()
  ));

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- STEP 6: Create indexes
-- Run this sixth:

CREATE INDEX IF NOT EXISTS idx_service_types_queue_id ON service_types(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_settings_queue_id ON queue_settings(queue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_id ON notifications(queue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_token_id ON notifications(token_id);
CREATE INDEX IF NOT EXISTS idx_tokens_service_type_id ON tokens(service_type_id);
CREATE INDEX IF NOT EXISTS idx_tokens_priority_level ON tokens(priority_level);

-- STEP 7: Insert default settings for existing queues
-- Run this last:

INSERT INTO queue_settings (queue_id)
SELECT id FROM queues 
WHERE id NOT IN (SELECT queue_id FROM queue_settings WHERE queue_id IS NOT NULL);

-- Verification query - run this to check if everything worked:
SELECT 
  'Tables created successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'service_types') as service_types_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'queue_settings') as queue_settings_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'notifications') as notifications_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'contact_number') as contact_number_exists;
