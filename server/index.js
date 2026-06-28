import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url || 'file:///index.js');
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Qwen AI Client (OpenAI-compatible) ──────────────────────────────
const qwenClient = new OpenAI({
  apiKey: 'sk-ws-H.LRHHDH.89fi.MEQCIHnKmNup35xEc1nR9l1bnGiR36gu9c0vf9cjnBgQPDWQAiAED3nE9h2-b0l0CtGxEdBZNpz1a9G8SYQEG4lrpnY9pw',
  baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
});
const QWEN_MODEL = 'qwen-plus';

// \u2500\u2500 Supabase Client \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Use env vars if available, otherwise fallback to hardcoded defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nlkyifjwsrsxpedzdiay.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sa3lpZmp3c3JzeHBlZHpkaWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDUxNjUsImV4cCI6MjA5ODA4MTE2NX0.xT3CyXGWKscMHpkmVc3E60d4R1OsbLepK1BbGyhM1to';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to read/write DB
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = { workflows: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Routes
app.get('/api/workflows', (req, res) => {
  const db = readDB();
  res.json(db.workflows);
});

app.post('/api/workflows', (req, res) => {
  const db = readDB();
  const newWorkflow = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...req.body
  };
  db.workflows.push(newWorkflow);
  writeDB(db);
  res.status(201).json(newWorkflow);
});

app.patch('/api/workflows/:id', (req, res) => {
  const db = readDB();
  const index = db.workflows.findIndex(w => w.id === req.params.id);
  if (index !== -1) {
    db.workflows[index] = { ...db.workflows[index], ...req.body };
    writeDB(db);
    res.json(db.workflows[index]);
  } else {
    res.status(404).json({ message: 'Workflow not found' });
  }
});

// ── POST /api/agent/process-trigger ─────────────────────────────────
// Receives rawText → calls Qwen AI for extraction → saves to Supabase
app.post('/api/agent/process-trigger', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required in the request body' });
    }

    // Initialize agent logs with first step
    const agentLogs = [
      {
        step: 'received',
        timestamp: new Date().toISOString(),
        message: 'Raw text received for processing'
      }
    ];

    // Step 1: Submit rawText to Qwen AI with strict JSON enforcement
    const completion = await qwenClient.chat.completions.create({
      model: QWEN_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert business assistant. Analyze this messy unstructured request and extract: clientName, projectScope, estimatedHours, and proposedBudget. Return your final answer strictly in JSON.'
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      response_format: { type: 'json_object' }
    });

    const extractedPayload = JSON.parse(completion.choices[0].message.content || '{}');

    agentLogs.push({
      step: 'ai_extraction_complete',
      timestamp: new Date().toISOString(),
      message: 'Qwen AI successfully extracted structured data',
      model: QWEN_MODEL
    });

    // Step 2: Save to Supabase workflows table with pending_approval status
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        trigger_source: 'webhook',
        raw_input_text: rawText,
        extracted_payload: extractedPayload,
        status: 'pending_approval',
        agent_logs: agentLogs
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        error: 'Failed to save workflow to database',
        details: error.message
      });
    }

    // Step 3: Respond to frontend with the saved workflow
    res.status(201).json({
      success: true,
      message: 'Trigger processed successfully. Workflow is pending approval.',
      workflow: data,
      extractedPayload
    });

  } catch (error) {
    console.error('Process Trigger Error:', error);
    res.status(500).json({
      error: 'Internal server error during trigger processing',
      details: error.message
    });
  }
});

// ── POST /api/webhook/process-request ───────────────────────────────
// Full automation pipeline: Receive → Insert (pending_extraction) → AI Extract → Update (pending_approval)
app.post('/api/webhook/process-request', async (req, res) => {
  try {
    const { rawText, triggerSource = 'webhook' } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required in the request body' });
    }

    // Step 1: Insert initial record with pending_extraction status
    const initialLogs = [
      {
        step: 'webhook_received',
        timestamp: new Date().toISOString(),
        message: 'Unstructured request received via webhook',
        trigger_source: triggerSource
      }
    ];

    const { data: initialWorkflow, error: insertError } = await supabase
      .from('workflows')
      .insert({
        trigger_source: triggerSource,
        raw_input_text: rawText,
        status: 'pending_extraction',
        agent_logs: initialLogs
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert initial workflow:', insertError);
      return res.status(500).json({
        error: 'Failed to create workflow record',
        details: insertError.message
      });
    }

    console.log(`✓ Workflow ${initialWorkflow.id} created with status: pending_extraction`);

    // Step 2: Call Qwen AI for extraction
    const extractionLogs = [
      ...initialLogs,
      {
        step: 'ai_extraction_started',
        timestamp: new Date().toISOString(),
        message: 'Calling Qwen AI for structured data extraction',
        model: QWEN_MODEL
      }
    ];

    const completion = await qwenClient.chat.completions.create({
      model: QWEN_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Extract four pieces of key business information out of this unstructured request text: clientName, projectScope, estimatedHours, and proposedBudget. Return nothing but raw JSON.'
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      response_format: { type: 'json_object' }
    });

    let extractedPayload = {};
    try {
      extractedPayload = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (parseError) {
      console.error('AI JSON Parse Error:', parseError);
      console.log('Raw AI Output:', completion.choices[0].message.content);
      extractedPayload = { error: 'Failed to parse AI response', raw: completion.choices[0].message.content };
    }

    console.log('✓ AI extraction complete:', extractedPayload);

    // Step 3: Update workflow with extracted payload and transition to pending_approval
    const finalLogs = [
      ...extractionLogs,
      {
        step: 'ai_extraction_complete',
        timestamp: new Date().toISOString(),
        message: 'Structured data extracted successfully',
        fields_extracted: Object.keys(extractedPayload).length
      },
      {
        step: 'status_transition',
        timestamp: new Date().toISOString(),
        message: 'Workflow ready for human review',
        new_status: 'pending_approval'
      }
    ];

    const { data: updatedWorkflow, error: updateError } = await supabase
      .from('workflows')
      .update({
        extracted_payload: extractedPayload,
        status: 'pending_approval',
        agent_logs: finalLogs
      })
      .eq('id', initialWorkflow.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update workflow:', updateError);
      return res.status(500).json({
        error: 'Failed to update workflow with extracted data',
        details: updateError.message
      });
    }

    console.log(`✓ Workflow ${updatedWorkflow.id} updated to status: pending_approval`);

    // Step 4: Respond with the complete workflow
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully. Workflow is now pending approval.',
      workflow: updatedWorkflow,
      extractedPayload
    });

  } catch (error) {
    console.error('Webhook Process Request Error:', error);
    res.status(500).json({
      error: 'Internal server error during webhook processing',
      details: error.message
    });
  }
});

// Explicitly listen on all interfaces for sandbox compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\ud83d\ude80 Automation Engine running on http://0.0.0.0:${PORT}`);
  console.log(`\u2713 Supabase Client connected to ${supabaseUrl}`);
  
  // Verify DB access
  supabase.from('workflows').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) console.error('\u26a0\ufe0f Supabase Connection Warning:', error.message);
      else console.log('\u2713 Supabase Connection Verified. Records in workflows:', count);
    });
});
