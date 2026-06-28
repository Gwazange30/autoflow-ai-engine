# 🚀 Autoflow-ai-engine

An autonomous, human-in-the-loop enterprise data pipeline built natively to solve manual processing friction, optimize workflows, and structure incoming data models seamlessly.

---

## 👤 Developer Profile

*   **Name:** Aliyu Muhammad Mande
*   **Role:** Software Developer
*   **Project Name:** Autoflow-ai-engine
*   **Contact/Email:** aliyumuhammadmande30@gmail.com

---

## 🛠️ Architecture & Local Deployment

This engine uses a TypeScript backend engine orchestrating structured datasets alongside an integrated frontend UI. 

To execute the software locally on a Windows platform:

1. Install essential package node modules:
   ```bash
   npm install

## Spin up the localized Vite server bypassing standard CLI port assignment scripts:

npx vite --port 3000 --host 0.0.0.0

# Implementation Plan - AutoFlow Agent: Backend Automation Engine

Implementing the complete backend automation engine linking Supabase to Qwen Cloud via a webhook endpoint.

## Scope Summary
- **Backend**: Implement `POST /api/webhook/process-request` in the Express server.
- **AI Core**: Connect to Qwen Cloud (model: `qwen3.7-max`) using the `openai` package.
- **Database**: Log unstructured requests, extract structured data, and update statuses in the Supabase `workflows` table.
- **Workflow**: Receive Raw Text -> Insert DB (`pending_extraction`) -> Call Qwen -> Update DB (`extracted_payload`, `pending_approval`) -> UI update.

## Auth & RLS model
**Auth in scope:** no
**Model:** no_auth_controlled_write (Server-side operations bypassing client-side RLS requirements for the webhook)
**RLS strategy:** The Express server acts as a trusted agent. It will use the `supabase-js` client (likely with an anon or service key as configured) to manage rows. RLS policies on `workflows` (SELECT/INSERT/UPDATE for `anon`) already support this.
**Frontend implication:** Items with `pending_approval` status will automatically appear in the "Approvals" tab due to the existing real-time/polling logic.

## Migration baseline
**Local migrations in project:** existing (`supabase/migrations/20250101000000_create_workflows_table.sql`)
**User confirmed proceed on connected DB:** yes

## Affected Areas
- `server/index.js`: Add the `/api/webhook/process-request` endpoint.
- `src/lib/api.ts`: Ensure backend interaction is consistent with existing frontend patterns.

## Phase 1: Webhook Endpoint Scaffolding
- Add `POST /api/webhook/process-request` to `server/index.js`.
- Extract raw text from the incoming request body.
- Insert initial record into Supabase:
  - `status`: `pending_extraction`
  - `trigger_source`: `webhook`
  - `raw_input_text`: <incoming_text>

## Phase 2: Qwen AI Integration
- Initialize/Use the Qwen client in the backend.
- Configuration:
  - `baseURL`: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
  - `apiKey`: `process.env.DASHSCOPE_API_KEY`
  - `model`: `qwen3.7-max`
- Call the model with:
  - System: 'Extract four pieces of key business information out of this unstructured request text: clientName, projectScope, estimatedHours, and proposedBudget. Return nothing but raw JSON.'
  - Options: `response_format: { type: "json_object" }`

## Phase 3: DB Update & Pipeline Transition
- Parse the AI response.
- Update the Supabase record:
  - `extracted_payload`: <ai_json>
  - `status`: `pending_approval`
  - `agent_logs`: Append "Extraction complete" step.

## Phase 4: Verification
- Ensure the "Approvals" dashboard tab correctly displays the newly processed items.

## Execution Handoff

**Plan status:** ready

**Dispatch order:**
1. supabase_engineer — Implement the webhook endpoint and AI automation logic.

**Per-agent instructions:**

### 1. supabase_engineer
- **Phases:** 1, 2, 3
- **Scope:** 
    - Implement `POST /api/webhook/process-request` in `server/index.js`.
    - Use the existing `supabase` and `qwenClient` instances (or re-initialize if needed for the server context).
    - Ensure the logic follows: 1) Save raw text (`pending_extraction`), 2) Call Qwen with strict JSON format, 3) Update row with payload and `pending_approval`.
    - Add meaningful steps to `agent_logs` (e.g., "Webhook received", "AI extraction started", "Payload saved").
- **Files:** `server/index.js`
- **Depends on:** none (DB schema already exists)
- **Acceptance criteria:** Sending a POST to `/api/webhook/process-request` with a text body results in a workflow row appearing in Supabase with `status: 'pending_approval'` and correctly parsed JSON in `extracted_payload`.

**Do not dispatch:**
- frontend_engineer (UI for Approvals is already implemented)
- quick_fix_engineer

IS_SUPABASE_REQUIRED: true
