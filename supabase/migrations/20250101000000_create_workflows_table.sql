-- Create workflows table for AutoFlow Agent pipeline tracking
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  trigger_source text,
  raw_input_text text,
  extracted_payload jsonb,
  status text DEFAULT 'pending_extraction',
  agent_logs jsonb
);

-- Enable Row Level Security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Index for status filtering (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows (status);

-- Index for created_at ordering (timeline views)
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows (created_at DESC);

-- GIN index on extracted_payload for JSONB queries
CREATE INDEX IF NOT EXISTS idx_workflows_extracted_payload ON workflows USING gin (extracted_payload);

-- GIN index on agent_logs for JSONB queries
CREATE INDEX IF NOT EXISTS idx_workflows_agent_logs ON workflows USING gin (agent_logs);

-- RLS Policies
-- Allow anon users (Express backend using anon key) to SELECT all workflows
CREATE POLICY "Allow anon read access on workflows"
  ON workflows
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users (Express backend using anon key) to INSERT workflows
CREATE POLICY "Allow anon insert access on workflows"
  ON workflows
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users (Express backend using anon key) to UPDATE workflows
CREATE POLICY "Allow anon update access on workflows"
  ON workflows
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users (Express backend using anon key) to DELETE workflows
CREATE POLICY "Allow anon delete access on workflows"
  ON workflows
  FOR DELETE
  TO anon
  USING (true);
