# Security, Compliance, and Scalability Notes

- Circle provides wallet infrastructure and MPC signing; developers are responsible for compliance and licenses.
- Arc supports institutional-grade FX and multiple fiat-backed stablecoins onchain, enabling real-world enterprise use cases.

## Scalability
- Queue events for horizontal scaling of agent workers.
- Use idempotent payment keys (shipment_id + invoice_id).

## Future Enhancements
- Dispute flows
- Partial payments
- Dynamic pricing based on IoT metrics
- More complex Incoterms logic

## Problem Solved
- Eliminates “paperwork lag” by binding delivery events to autonomous, trust-minimized settlement.
- Verification: Machine-readable IoT + invoice data + business rules.
- Settlement coupling: x402 payments, Arc finality, Circle wallets guarantee fast, inevitable payment.
- FX: StableFX enables synchronized PvP settlement in local stablecoins.
- Operationalization: APIs, webhooks, event schemas for ERP/logistics integration.