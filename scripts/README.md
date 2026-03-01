Scripts for Circle Testnet flows
================================

This folder contains ready-to-run scripts implementing Circle Wallets and Paymaster flows from `docs/testnet-instruction.md`.
**No private npm packages required** — scripts use Circle REST API directly.

- `createWalletSet.ts` — POST to Circle API to create a Wallet Set; prints the ID.
- `createWallets.ts` — POST to Circle API to create wallets in a Wallet Set.
- `sendUsdcWithPaymaster.ts` — template showing `paymasterAndData` encoding (requires `viem`).

Setup
-----

1. Copy `.env.example` to `.env` and fill in `CIRCLE_API_KEY` (get from Circle Developer Console).

2. Install minimal deps:

```bash
cd SAASCS
npm install viem
```

3. Run scripts in mock or real mode:

**Mock mode** (no API calls, no keys needed):
```bash
$env:MOCK_CIRCLE='true'; npx ts-node scripts/createWalletSet.ts
$env:MOCK_CIRCLE='true'; npx ts-node scripts/createWallets.ts
$env:MOCK_CIRCLE='true'; npx ts-node scripts/sendUsdcWithPaymaster.ts
```

**Real mode** (calls Circle REST API with your `CIRCLE_API_KEY`):
```bash
# 1. Create wallet set (prints ID)
npx ts-node scripts/createWalletSet.ts

# 2. Create wallets (prints wallet IDs/addresses)
npx ts-node scripts/createWallets.ts

# 3. Show paymasterAndData encoding
npx ts-node scripts/sendUsdcWithPaymaster.ts
```

Workflow
--------

1. Run `createWalletSet.ts` → save `id` to `WALLET_SET_ID` in `.env`
2. Run `createWallets.ts` → save wallet IDs and addresses to `.env`  
3. Fund buyer wallet at `https://faucet.circle.com` with test USDC
4. Run `sendUsdcWithPaymaster.ts` to see paymaster data encoding
5. For full Paymaster UserOp flow, see `docs/testnet-instruction.md` section 5 (requires Pimlico + SmartAccount)

Notes
-----
- Do not commit `.env` to source control.
- `sendUsdcWithPaymaster.ts` requires `viem` for `encodePacked()` but does not submit a real UserOp.
- Paymaster full flow requires SmartAccount (permissionless.js, Safe, etc.) + Pimlico bundler.
