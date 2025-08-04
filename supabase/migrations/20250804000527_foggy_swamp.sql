/*
  # Enhanced Queue Management System

  1. New Tables
    - `service_types` - Configurable service types for tokens
    - `queue_settings` - Queue configuration and settings
    - `notifications` - Notification history and settings
    - `admin_users` - System administrators
    - `queue_staff` - Staff assignments to queues
    - `token_history` - Detailed token lifecycle tracking

  2. Enhanced Tables
    - `tokens` - Added contact info, service type, estimated wait time
    - `queues` - Added status, priority settings, pause functionality
    - `queue_events` - Enhanced with service time tracking

  3. Security
    - Enhanced RLS policies for new tables
    - Role-based access control
    - Admin and staff permissions
*/

-- Create service types table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  estimated_duration_minutes integer DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create queue settings table
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

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  permissions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create queue staff table
CREATE TABLE IF NOT EXISTS queue_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'staff' CHECK (role IN ('manager', 'staff', 'viewer')),
  permissions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  UNIQUE(queue_id, user_id)
);

-- Create token history table
CREATE TABLE IF NOT EXISTS token_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  status_from text,
  status_to text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to existing tables
DO $$
BEGIN
  -- Add columns to tokens table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'contact_number') THEN
    ALTER TABLE tokens ADD COLUMN contact_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'service_type_id') THEN
    ALTER TABLE tokens ADD COLUMN service_type_id uuid REFERENCES service_types(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'priority_level') THEN
    ALTER TABLE tokens ADD COLUMN priority_level integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'estimated_wait_minutes') THEN
    ALTER TABLE tokens ADD COLUMN estimated_wait_minutes integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'no_show_at') THEN
    ALTER TABLE tokens ADD COLUMN no_show_at timestamptz;
  END IF;

  -- Add columns to queues table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queues' AND column_name = 'status') THEN
    ALTER TABLE queues ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queues' AND column_name = 'description') THEN
    ALTER TABLE queues ADD COLUMN description text;
  END IF;

  -- Add columns to queue_events table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_events' AND column_name = 'service_duration_minutes') THEN
    ALTER TABLE queue_events ADD COLUMN service_duration_minutes integer;
  END IF;
END $$;

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

-- Enable RLS on new tables
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_history ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for admin_users
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ));

-- Create RLS policies for queue_staff
CREATE POLICY "Users can read staff for own queues"
  ON queue_staff
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = queue_staff.queue_id 
    AND queues.manager_id = auth.uid()
  ) OR auth.uid() = user_id);

CREATE POLICY "Queue managers can manage staff"
  ON queue_staff
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = queue_staff.queue_id 
    AND queues.manager_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM queues 
    WHERE queues.id = queue_staff.queue_id 
    AND queues.manager_id = auth.uid()
  ));

-- Create RLS policies for token_history
CREATE POLICY "Users can read token history for own queues"
  ON token_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tokens 
    JOIN queues ON queues.id = tokens.queue_id
    WHERE tokens.id = token_history.token_id 
    AND queues.manager_id = auth.uid()
  ));

CREATE POLICY "Users can insert token history for own queues"
  ON token_history
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tokens 
    JOIN queues ON queues.id = tokens.queue_id
    WHERE tokens.id = token_history.token_id 
    AND queues.manager_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_types_queue_id ON service_types(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_settings_queue_id ON queue_settings(queue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_id ON notifications(queue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_token_id ON notifications(token_id);
CREATE INDEX IF NOT EXISTS idx_queue_staff_queue_id ON queue_staff(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_staff_user_id ON queue_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_token_history_token_id ON token_history(token_id);
CREATE INDEX IF NOT EXISTS idx_tokens_service_type_id ON tokens(service_type_id);
CREATE INDEX IF NOT EXISTS idx_tokens_priority_level ON tokens(priority_level);

-- Create function to calculate estimated wait time
CREATE OR REPLACE FUNCTION calculate_estimated_wait_time(queue_id_param uuid, position_param integer)
RETURNS integer AS $$
DECLARE
  avg_service_time integer;
  tokens_ahead integer;
BEGIN
  -- Get average service time from recent events (last 50 served tokens)
  SELECT COALESCE(AVG(wait_time_minutes), 15) INTO avg_service_time
  FROM queue_events 
  WHERE queue_id = queue_id_param 
    AND event_type = 'served' 
    AND created_at > NOW() - INTERVAL '7 days'
  LIMIT 50;
  
  -- Count tokens ahead in queue
  SELECT COUNT(*) INTO tokens_ahead
  FROM tokens 
  WHERE queue_id = queue_id_param 
    AND status = 'waiting' 
    AND position < position_param;
  
  RETURN tokens_ahead * avg_service_time;
END;
$$ LANGUAGE plpgsql;

-- Create function to update estimated wait times
CREATE OR REPLACE FUNCTION update_estimated_wait_times()
RETURNS trigger AS $$
BEGIN
  -- Update estimated wait times for all waiting tokens in the queue
  UPDATE tokens 
  SET estimated_wait_minutes = calculate_estimated_wait_time(NEW.queue_id, position)
  WHERE queue_id = NEW.queue_id 
    AND status = 'waiting';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update wait times when tokens change
CREATE TRIGGER update_wait_times_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_estimated_wait_times();

-- Insert default queue settings for existing queues
INSERT INTO queue_settings (queue_id)
SELECT id FROM queues 
WHERE id NOT IN (SELECT queue_id FROM queue_settings);