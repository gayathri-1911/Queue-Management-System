/*
  # Queue Management System Database Schema

  1. New Tables
    - `queues`
      - `id` (uuid, primary key)
      - `name` (text)
      - `manager_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    
    - `tokens`
      - `id` (uuid, primary key)
      - `queue_id` (uuid, references queues)
      - `person_name` (text)
      - `position` (integer)
      - `status` (enum: waiting, serving, served, cancelled)
      - `created_at` (timestamp)
      - `served_at` (timestamp, nullable)
      - `cancelled_at` (timestamp, nullable)
    
    - `queue_events`
      - `id` (uuid, primary key)
      - `queue_id` (uuid, references queues)
      - `token_id` (uuid, references tokens)
      - `event_type` (enum: added, served, cancelled, reordered)
      - `wait_time_minutes` (integer, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own queues
    - Add policies for queue tokens and events
*/

-- Create custom types
CREATE TYPE token_status AS ENUM ('waiting', 'serving', 'served', 'cancelled');
CREATE TYPE event_type AS ENUM ('added', 'served', 'cancelled', 'reordered');

-- Create queues table
CREATE TABLE IF NOT EXISTS queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  status token_status DEFAULT 'waiting',
  created_at timestamptz DEFAULT now(),
  served_at timestamptz,
  cancelled_at timestamptz
);

-- Create queue_events table for analytics
CREATE TABLE IF NOT EXISTS queue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  token_id uuid NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  wait_time_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_events ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_queues_manager_id ON queues(manager_id);
CREATE INDEX IF NOT EXISTS idx_tokens_queue_id ON tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_tokens_position ON tokens(queue_id, position);
CREATE INDEX IF NOT EXISTS idx_queue_events_queue_id ON queue_events(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_events_created_at ON queue_events(created_at);