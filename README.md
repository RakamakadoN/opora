# OPORA — A Digital Support Navigator for Families

**OPORA** is an application for parents of children with developmental differences and the professionals who support them. It helps families navigate the journey from early questions and observations to preparing for appointments, organizing day-to-day care, and working with healthcare professionals — one step at a time, without information overload.

> **Our guiding idea:** Parents shouldn't have to keep everything in their heads. OPORA helps them identify the next step, organize important information, and arrive at appointments better prepared.

**Status:** Evolving MVP / prototype. Some features and data sources still require validation and configuration before use in real-world care settings.

[Explore the web app](https://opora-seven.vercel.app)

## The Problem OPORA Addresses

Families navigating questions about a child's development often have to find reliable information, document observations, understand administrative requirements, locate specialists, and coordinate care — all at once. Important details get scattered across messages, notes, and paper records.

OPORA brings these activities together in a clear path: **understand what's happening → record observations → prepare information → talk to the right professional → decide on the next step**.

## Features

| Area | What it helps with |
| --- | --- |
| **Navigator** | Understand stages of support, plan next steps, and prepare for consultations |
| **AI Assistant** | Draft questions for clinicians, organize observations, and explain complex terminology in plain language |
| **Care Tracker** | Record schedules and observations related to medications, food, reactions, and daily events; prepare visit summaries |
| **Documents & Institutions** | Build checklists, track deadlines, and navigate PMPK (psychological-medical-pedagogical commissions), medical-social assessments, and other administrative processes |
| **Places Directory** | Explore specialists, centers, and accessible or accommodating services; listings should be independently verified |
| **Community** | Ask questions and share experiences in a parent-focused space |
| **Clinician Workspace** | Review child profiles and observations, work with sensory profiles, support plans, and family activities |

OPORA supports two roles: **“I'm a parent”** and **“I'm a doctor.”** The interface is designed primarily for mobile use. The repository also includes Android and iOS projects built with Capacitor.

## Our Principles

- **Support without alarm.** Clear next steps instead of overwhelming conclusions.
- **Observations before assumptions.** Recorded events, care instructions, and observations are kept distinct from interpretations.
- **People remain in control.** AI helps organize information and formulate questions; it does not replace clinical or professional judgment.
- **Every family has its own context.** Guidance should reflect the child's situation rather than rely on a one-size-fits-all checklist.

> **Medical disclaimer:** OPORA is not a medical device. It does not diagnose conditions, prescribe or discontinue treatment, or replace an in-person medical consultation. AI-generated guidance and information about professionals or institutions must be independently verified. In a medical emergency, contact local emergency services.

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Data:** PostgreSQL with server-side migrations for Railway Postgres
- **AI:** Server-side AI API integrations, when configured with the required credentials
- **Mobile projects:** Capacitor (Android / iOS)

## Getting Started Locally

Requirements: **Node.js 22** and **npm 10+**.

```bash
npm install
cp .env.example .env
npm run dev
```

By default, the server runs at `http://localhost:3000`. To use port 5555:

```bash
PORT=5555 npm run dev
```

Configure the required environment variables in your local `.env` before using integrations. **Never commit API keys, medical records, or families' personal data.**

## Build & Production

```bash
npm ci
npm run lint
npm run build
NODE_ENV=production PORT=3000 npm run start
```

Health check: `GET /api/health`.

### Deploying to Railway

The repository includes `railway.json`.

- **Build command:** `npm run build`
- **Start command:** `npm run start`
- **Environment variables:** See `.env.example`
- **PostgreSQL:** Add a database service in Railway and set `DATABASE_URL` for the application service. On startup, the server applies `db/railway-postgres.sql`.

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

**OPORA doesn't replace parents or professionals. It stands alongside them, making the next step easier to understand.**
