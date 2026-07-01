-- SQL migration: create tables for pipelines, assignments, attendance, reminders and portal_enabled flag

BEGIN;

-- pipelines
CREATE TABLE IF NOT EXISTS pipelines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  creator_id INTEGER,
  stages JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- pipeline assignments
CREATE TABLE IF NOT EXISTS pipeline_assignments (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  employee_id INTEGER,
  assigned_by INTEGER,
  assigned_at TIMESTAMP DEFAULT now(),
  status VARCHAR(32) DEFAULT 'active'
);

-- attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  punch_in_time TIMESTAMP,
  punch_out_time TIMESTAMP,
  punch_in_lat DOUBLE PRECISION,
  punch_in_lon DOUBLE PRECISION,
  punch_out_lat DOUBLE PRECISION,
  punch_out_lon DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- reminders
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(64) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  next_send_at TIMESTAMP,
  interval_minutes INTEGER,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- add portal_enabled to employees table if it exists
ALTER TABLE IF EXISTS employees
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT TRUE;

COMMIT;
