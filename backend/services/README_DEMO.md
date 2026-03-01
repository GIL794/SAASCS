# End-to-End Orchestration & Demo Script

## Runtime Topology
- IoT Simulator
- Agent Service
- (Optional) Dashboard / Web UI

## Start Commands
- IoT Simulator: `node simulator/iot_simulator.ts`
- Agent Service: `npm run start:agent` or `node services/main.ts`

## Demo Flow Script
1. Show pending shipments and invoices.
2. Trigger a "Cargo Delivered" event from CLI.
3. Show Gemini log: validates delivery and approves payment.
4. Show payment transaction on Arc explorer and Circle console (sub-second finality, gas in USDC).
5. (Stretch) Show multilingual invoice, StableFX called, EURC payout executed.

## Monitoring & Logging
- EVENT_RECEIVED
- AI_DECISION
- PAYMENT_SUBMITTED
- PAYMENT_CONFIRMED
- FX_SWAP_EXECUTED
- ERROR

Logs are printed to console for demo clarity.