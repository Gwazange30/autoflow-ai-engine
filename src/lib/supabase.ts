import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Workflow {
  id: string;
  created_at: string;
  trigger_source: string | null;
  raw_input_text: string | null;
  extracted_payload: Record<string, any> | null;
  status: string;
  agent_logs: Record<string, any> | null;
}
