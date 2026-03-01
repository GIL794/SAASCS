# ZeroLag

Autonomous, event-driven supply-chain settlement on Arc.

ZeroLag connects IoT delivery events to AI-based approval logic and on-chain payout rails, so suppliers get paid as soon as delivery conditions are validated.

## Why ZeroLag

- Eliminates paperwork lag between delivery and payment.
- Automates settlement decisions with a policy-aware AI agent.
- Uses Circle programmable wallets + Arc settlement rails for fast, auditable payouts.
- Supports extension points for FX routing (StableFX) and x402-compatible flows.

## System Overview

```text
IoT Event (delivery proof)
	|
	v
Backend Agent (Express + Gemini)
  - validate payload
  - evaluate delivery
  - enforce idempotency/limits
	|
	v
Payment Orchestration (Circle + Arc)
	|
	v
Live Dashboard (Next.js)
  - shipments
  - event log (SSE)
  - payment status
```

## Demo Video

<video src="docs/images/Recording%202026-03-01%20102312.mp4" controls width="100%"></video>

Direct link: [Watch or download the demo video (Google Drive)](https://drive.google.com/file/d/1fO9vmxapg6Fekw91hBb0BoTCUNCyqGpK/view?usp=sharing)

## Repository Structure

- `backend/` — agent service, payment orchestration, simulator, config, logs.
- `frontend/` — Next.js dashboard with live event and payment views.
- `scripts/` — helper scripts for wallet setup and test transfers.
- `docs/` — instructions, prompts, and screenshots.

## Tech Stack

- Backend: TypeScript, Express, Zod, AJV, Helmet, CORS, rate limiting.
- Frontend: Next.js 14, React 18, Tailwind, Radix UI.
- Integrations: Google Gemini, Circle programmable wallets, Arc, StableFX.

## Quick Start

### 1) Install dependencies

From repo root:

```bash
npm install
```

Then install app dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment

Create `backend/.env` (or use the dashboard settings endpoint) with your keys.

Minimal local/dev values:

```env
FRONTEND_ORIGIN=http://localhost:3000
# Optional (recommended for non-local demos)
# BACKEND_API_KEY=your_api_key

# Integrations
GEMINI_API_KEY=
CIRCLE_API_KEY=
CIRCLE_WALLET_SET_ID=
CIRCLE_PAYMASTER_CONFIG=
STABLEFX_ENDPOINT=
STABLEFX_API_KEY=
ARC_ENDPOINT=
ARC_API_KEY=
ARC_X402_URL=
```

### 3) Run backend

```bash
cd backend
npm run start:agent
```

Backend starts on `http://localhost:8000`.

### 4) Run frontend

```bash
cd frontend
npm run dev
```

Frontend starts on `http://localhost:3000` and proxies `/api/*` to the backend.

### 5) Optional: trigger simulator

```bash
cd backend
npm run start:simulator
```

## Key API Endpoints

- `POST /events` — ingest delivery events and trigger decision/payment flow.
- `GET /logs` — fetch parsed event logs.
- `GET /logs/stream` — live log stream via Server-Sent Events.
- `GET /shipments` — fetch simulated shipment list.
- `GET /payments` — fetch payment-specific log events.
- `GET /settings`, `POST /settings` — read/write backend `.env` settings.

## Event Lifecycle

Typical progression in logs:

1. `EVENT_RECEIVED`
2. `AI_DECISION`
3. `PAYMENT_SUBMITTED`
4. `PAYMENT_CONFIRMED`

Error paths are recorded as `ERROR` entries.

## Security Notes

- Optional API-key authentication via `BACKEND_API_KEY`.
- CORS is restricted using `FRONTEND_ORIGIN`.
- Payload validation and amount/currency guardrails are enforced server-side.
- Security and hardening notes: `SECURITY_AUDIT.md` and `backend/README_SECURITY.md`.

## Screenshots

### Dashboard & Flows

![ZeroLag Screenshot 01](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.32.31.jpeg)
![ZeroLag Screenshot 02](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.34.31.jpeg)
![ZeroLag Screenshot 03](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.35.05.jpeg)
![ZeroLag Screenshot 04](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.35.26.jpeg)
![ZeroLag Screenshot 05](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.35.46.jpeg)
![ZeroLag Screenshot 06](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.36.05.jpeg)
![ZeroLag Screenshot 07](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.36.24.jpeg)
![ZeroLag Screenshot 08](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.37.35.jpeg)
![ZeroLag Screenshot 09](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.37.51.jpeg)
![ZeroLag Screenshot 10](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.38.09.jpeg)
![ZeroLag Screenshot 11](docs/images/WhatsApp%20Image%202026-02-28%20at%2019.38.47.jpeg)

## Demo Steps

1. Open dashboard and show pending shipments.
2. Trigger a delivery event from simulator or dashboard action.
3. Watch AI decision in real time in event log stream.
4. Show payment submission + confirmation entries.


