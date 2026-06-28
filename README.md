# Autoflow-ai-engine

An autonomous, human-in-the-loop workflow automation engine designed to parse unstructured enterprise data, eliminate backend processing errors, and streamline business metrics seamlessly. Built for **Track 4: Autopilot Agent** in the **Global AI Hackathon Series with Qwen Cloud**.

---

## 👤 Developer Profile
- **Name:** Aliyu Muhammad Mande
- **Role:** Software Developer
- **Email:** aliyumuhammadmande30@gmail.com

---

## 🚀 Core Features
* **⚡ Simulate Messy Incoming Request:** An interactive dashboard checkpoint that captures unformatted business text, cleans it, and structures it into reliable data schemas automatically.
* **📊 Live Metric Workspace:** Dynamic real-time tracking across vital enterprise numbers including:
  * **Total Revenue:** $45,231.89
  * **Active Invoices:** 12
  * **Pending Quotes:** 24
* **🛡️ Human-in-the-Loop Safeguards:** An approval workflow layout built to securely process chaotic documentation before writing to production database instances.

---

## 🛠️ Tech Stack & Architecture
This workspace leverages a highly efficient, production-ready stack:
- **Frontend Core:** React & TypeScript (for strict schema type-safety)
- **Build Pipeline:** Vite (for lightning-fast hot reloading and bundling)
- **Data Persistence:** Supabase Integration
- **Server Mechanics:** Express-based Mock Engine Server (`server/index.js`)

---

## 📦 Local Installation & Setup

Follow these exact steps to run the enterprise dashboard locally:

1. **Install Project Dependencies:**
   ```bash
   npm install

## Run the Backend Mock Database Server:
node server/index.js

## Spin up the localized Vite server bypassing standard CLI port assignment scripts:
npx vite --port 3000 --host 0.0.0.0

# AutoFlow Agent - Enterprise Automation Workflow

Automated business invoicing and quotations platform built for Track 4 (Autopilot Agent) of the Global AI Hackathon Series.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js/Express.js (Scaffolding provided in `server/`)
- **AI Core**: Qwen Cloud via OpenAI SDK (`qwen3.7-max` model)
- **Database**: Pipeline logging to `server/db.json` (with LocalStorage fallback)

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js

### Installation
```bash
bun install
```

### Environment Variables
Create a `.env` file or set in your environment:
```env
VITE_DASHSCOPE_API_KEY=your_api_key_here
```

### Running the Application

**Run Frontend & Backend (Scaffold):**
```bash
bun run server # Starts the API on port 3001
bun run dev    # Starts the Vite dashboard on port 3000
```

*Note: The frontend includes a fallback to LocalStorage if the backend server is not reachable.*

## AI Integration Details
The Autopilot Agent utilizes the following configuration:
- **Base URL**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- **Model**: `qwen3.7-max`
- **Agent Role**: Specialized in generating structured business documents (Invoices/Quotations) from natural language prompts.
