# Backend Services

- agent.ts: Gemini AI logic, decision engine, idempotency, logging
- payments.ts: Circle wallet setup, payment flow, Arc integration, x402, Paymaster
- stablefx.ts: FX routing via StableFX

Each service exposes functions for orchestration in the main backend entrypoint.