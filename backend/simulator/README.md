# IoT Event Simulator

- Reads shipments from shipments.json
- Emits "Cargo Delivered" events every 30 seconds or via CLI
- Sends events to Agent Service at http://localhost:8000/events

## Run Loop Mode

```bash
node simulator/iot_simulator.ts
```

## Run CLI Mode

```bash
node simulator/iot_simulator.ts SHIP123
```