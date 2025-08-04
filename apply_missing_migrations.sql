-- Complete Queue Management System Database Setup
-- Run this in your Supabase SQL Editor

-- Create custom types
CREATE TYPE token_status AS ENUM ('waiting', 'serving', 'served', 'cancelled', 'no_show');
CREATE TYPE event_type AS ENUM ('added', 'served', 'cancelled', 'reordered');

-- Create queues table
CREATE TABLE IF NOT EXISTS queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create tokens table with all columns
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  contact_number text,
  service_type_id uuid,
  priority_level integer DEFAULT 1,
  position integer NOT NULL DEFAULT 1,
  status token_status DEFAULT 'waiting',
  estimated_wait_minutes integer,
  created_at timestamptz DEFAULT now(),
  served_at timestamptz,
  cancelled_at timestamptz,
  no_show_at timestamptz
);

-- Create queue_events table for analytics
CREATE TABLE IF NOT EXISTS queue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  token_id uuid NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  wait_time_minutes integer,
  service_duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Update token status enum to include no_show
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_status_new') THEN
    CREATE TYPE token_status_new AS ENUM ('waiting', 'serving', 'served', 'cancelled', 'no_show');
    ALTER TABLE tokens ALTER COLUMN status TYPE token_status_new USING status::text::token_status_new;
    DROP TYPE token_status;
    ALTER TYPE token_status_new RENAME TO token_status;
  END IF;
END $$;

-- Create service_types table (simplified version)
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  estimated_duration_minutes integer DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create queue_settings table
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

-- Create notifications table
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

-- Enable RLS on all tables
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for queues
CREATE POLICY "Users can read own queues"
  ON queues
  FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Users can create queues"
  ON queues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Users can update own queues"
  ON queues
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Users can delete own queues"
  ON queues
  FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- RLS Policies for tokens
CREATE POLICY "Users can read tokens from own queues"
  ON tokens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = tokens.queue_id
      AND queues.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tokens in own queues"
  ON tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = tokens.queue_id
      AND queues.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tokens in own queues"
  ON tokens
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = tokens.queue_id
      AND queues.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = tokens.queue_id
      AND queues.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tokens from own queues"
  ON tokens
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = tokens.queue_id
      AND queues.manager_id = auth.uid()
    )
  );

-- RLS Policies for queue_events
CREATE POLICY "Users can read events from own queues"
  ON queue_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = queue_events.queue_id
      AND queues.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for own queues"
  ON queue_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queues
      WHERE queues.id = queue_events.queue_id
      AND queues.manager_id = auth.uid()
    )
  );

-- Create RLS policies for service_types
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

-- Create RLS policies for queue_settings
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

-- Create RLS policies for notifications
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queues_manager_id ON queues(manager_id);
CREATE INDEX IF NOT EXISTS idx_tokens_queue_id ON tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_tokens_position ON tokens(queue_id, position);
CREATE INDEX IF NOT EXISTS idx_queue_events_queue_id ON queue_events(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_events_created_at ON queue_events(created_at);
CREATE INDEX IF NOT EXISTS idx_service_types_queue_id ON service_types(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_settings_queue_id ON queue_settings(queue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_id ON notifications(queue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_token_id ON notifications(token_id);
CREATE INDEX IF NOT EXISTS idx_tokens_service_type_id ON tokens(service_type_id);
CREATE INDEX IF NOT EXISTS idx_tokens_priority_level ON tokens(priority_level);

-- Insert default queue settings for existing queues
INSERT INTO queue_settings (queue_id)
SELECT id FROM queues 
WHERE id NOT IN (SELECT queue_id FROM queue_settings);

-- Success message
SELECT 'Database migrations applied successfully!' as result;
