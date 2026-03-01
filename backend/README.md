# AgenticSCM Backend Setup

## Requirements

- Node.js 20+ and npm or pnpm
- Python 3.11+ and pip or Poetry

## Setup (TypeScript)

```bash
cd backend
npm init -y
npm install axios dotenv ajv express
```

## Setup (Python)

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install fastapi pydantic requests python-dotenv
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials.

## Project Structure

- config/        # Service configs
- models/        # Data models & schemas
- services/      # Business logic (agent, payments, FX)
- simulator/     # IoT event simulator

## Start Backend

- TypeScript: `npm run start:agent`
- Python: `python services/agent.py`
