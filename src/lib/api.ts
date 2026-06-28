import { supabase, type Workflow } from './supabase';
import { toast } from 'sonner';

export type { Workflow } from './supabase';

export async function fetchWorkflows(): Promise<Workflow[]> {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching workflows:', error);
    toast.error('Failed to load workflows from database');
    return [];
  }
}

export async function createWorkflow(payload: {
  trigger_source?: string;
  raw_input_text?: string;
  extracted_payload?: Record<string, any>;
  status?: string;
  agent_logs?: Record<string, any>;
}): Promise<Workflow | null> {
  try {
    const newWorkflow = {
      trigger_source: payload.trigger_source || 'webhook',
      raw_input_text: payload.raw_input_text || null,
      extracted_payload: payload.extracted_payload || null,
      status: payload.status || 'pending_extraction',
      agent_logs: payload.agent_logs || { steps: [{ action: 'created', timestamp: new Date().toISOString() }] },
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert([newWorkflow])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating workflow:', error);
    toast.error('Failed to save workflow to database');
    return null;
  }
}

export async function updateWorkflowStatus(
  id: string,
  status: string,
  agent_logs?: Record<string, any>
): Promise<Workflow | null> {
  try {
    const updateData: any = { status };
    if (agent_logs) {
      updateData.agent_logs = agent_logs;
    }

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating workflow:', error);
    toast.error('Failed to update workflow status');
    return null;
  }
}

export async function updateWorkflowPayload(
  id: string,
  extracted_payload: Record<string, any>,
  agent_logs?: Record<string, any>
): Promise<Workflow | null> {
  try {
    const updateData: any = { extracted_payload };
    if (agent_logs) {
      updateData.agent_logs = agent_logs;
    }

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating workflow payload:', error);
    toast.error('Failed to update workflow payload');
    return null;
  }
}

export async function simulateWebhookRequest(text: string): Promise<any> {
  // 1. Try Backend first
  try {
    const response = await fetch('/api/webhook/process-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText: text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Intercept 'API key' issue or any error to trigger fallback
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.warn('Backend failed, falling back to direct frontend AI extraction:', error.message);
    
    // 2. Frontend Catch-Block Fallback: Point straight to Qwen Cloud from the browser
    try {
      // Use the key found in ai-client.ts
      const qwenApiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || '';
      
      const qwenResponse = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qwenApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            {
              role: 'system',
              content: 'Extract the following business details from the text and return as a strict JSON object: clientName, projectScope, estimatedHours (number), proposedBudget (number). Only return JSON.'
            },
            { role: 'user', content: text }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      if (!qwenResponse.ok) {
        throw new Error(`Qwen Cloud API error! status: ${qwenResponse.status}`);
      }

      const qwenData = await qwenResponse.json();
      const extractedPayload = JSON.parse(qwenData.choices[0].message.content || '{}');
      
      // 3. Mock UI Update: Update database tables directly
      const { data, error: dbError } = await supabase
        .from('workflows')
        .insert([{
          trigger_source: 'webhook-frontend-fallback',
          raw_input_text: text,
          extracted_payload: extractedPayload,
          status: 'pending_approval',
          agent_logs: { 
            steps: [
              { action: 'received', timestamp: new Date().toISOString() },
              { action: 'backend_failed_triggered_fallback', timestamp: new Date().toISOString() },
              { action: 'extracted_via_frontend_qwen', timestamp: new Date().toISOString() }
            ] 
          }
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      
      return data;
    } catch (fallbackError: any) {
      console.error('Frontend fallback also failed:', fallbackError);
      throw new Error(`Critical Error: Backend and Frontend Fallback both failed. ${fallbackError.message}`);
    }
  }
}
