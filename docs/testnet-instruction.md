For **JS/TS on Base testnet (Base Sepolia)** you’ll do two things:

1. Use **Circle Programmable Wallets (dev‑controlled)** to get a **wallet set ID** and wallets on `BASE-SEPOLIA`.  
2. Use **Circle Paymaster** with an ERC‑4337 smart account on **Base Sepolia** so gas is paid in **USDC**, not ETH.[1][2][3][4]

Below is a concrete, step‑by‑step path with code skeletons.

***

## 1. Project setup (Node + env)

```bash
mkdir agentic-scm-circle
cd agentic-scm-circle
npm init -y
npm install @circle-fin/w3s-wallets dotenv
```

Add `.env`:

```env
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
```

You get both from the **Circle Developer Console**: create an API key and register an **Entity Secret** following the dev‑controlled wallet quickstart / CircleU tutorial.[5][6][7][8]

***

## 2. Create a Wallet Set on Base Sepolia and get the ID

Circle supports **Base Sepolia Testnet** with chain code `BASE-SEPOLIA` in Programmable Wallets.[4]

Create `scripts/createWalletSet.ts`:

```ts
import 'dotenv/config';
import { DevControlledWalletsClient } from '@circle-fin/w3s-wallets';

async function main() {
  const client = new DevControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  const res = await client.createWalletSet({
    name: 'agentic-scm-wallet-set',
  });

  console.log('Wallet set created:', res.data);
}

main().catch(console.error);
```

Run:

```bash
npx ts-node scripts/createWalletSet.ts
```

The output will include something like:

```json
{
  "id": "ws_test_1234567890",
  "name": "agentic-scm-wallet-set",
  ...
}
```

Store this as your **Wallet Set ID**:

```env
WALLET_SET_ID=ws_test_1234567890
```

This is the ID you’ll reuse whenever you create wallets or query balances in this set.[6][9][8]

***

## 3. Create buyer/supplier wallets on Base Sepolia

Create `scripts/createWallets.ts`:

```ts
import 'dotenv/config';
import { DevControlledWalletsClient } from '@circle-fin/w3s-wallets';

async function main() {
  const client = new DevControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  const res = await client.createWallets({
    walletSetId: process.env.WALLET_SET_ID!,
    count: 2,
    // use Base Sepolia testnet
    blockchain: 'BASE-SEPOLIA',
    name: 'agentic-scm-wallet',
  });

  console.log('Wallets created:', JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
```

Run:

```bash
npx ts-node scripts/createWallets.ts
```

You’ll get back wallet IDs and addresses for two dev‑controlled wallets. Save them:

```env
BUYER_WALLET_ID=...
SUPPLIER_WALLET_ID=...
BUYER_WALLET_ADDRESS=0x...
SUPPLIER_WALLET_ADDRESS=0x...
```

Circle’s docs and example repos follow this exact pattern: create a wallet set, then create wallets in that set on the chosen chain (here `BASE-SEPOLIA`).[9][10][8][6][4]

***

## 4. Fund the Base Sepolia wallets with test USDC

Use the **Circle testnet faucet** to send USDC to the **buyer wallet address** on **Base Sepolia**:[11][12][13]

1. Go to `https://faucet.circle.com`.  
2. Paste `BUYER_WALLET_ADDRESS`.  
3. Choose **Base Sepolia** network.  
4. Request test **USDC** (and some test ETH if needed).

The canonical **Base Sepolia USDC test address** (from Circle‑aligned references) is:

```text
USDC on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

Confirm this against Circle’s USDC contract directory before hard‑coding.[14][15]

***

## 5. Circle Paymaster on Base Sepolia (gas in USDC)

Circle Paymaster is an **ERC‑4337 paymaster** that lets you pay gas in USDC, integrated with bundlers like Pimlico/Alchemy.[2][3][1]
On Base Sepolia you’ll follow essentially the **same pattern as the Arbitrum & generic quickstarts**, just with `baseSepolia` and the Base Sepolia USDC address.[16][17][1]

You’ll need:

- **A 4337 smart account** (e.g. Safe, or a Coinbase Smart Wallet, or a permissionless.js SmartAccount) on **Base Sepolia**.  
- A **bundler** (e.g. Pimlico) endpoint for Base Sepolia.  
- The **Circle Paymaster address** for Base Sepolia from the Paymaster quickstart.[3][1]

### 5.1 Install 4337 tooling

In the same project:

```bash
npm install viem permissionless @pimlico/sdk
```

(Exact packages may vary; Pimlico’s tutorial template uses `viem` and `permissionless` for SmartAccount + bundler.)[16]

### 5.2 Configure Base Sepolia + USDC

Create `src/config.ts`:

```ts
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const PUBLIC_RPC_URL = 'https://sepolia.base.org'; // or a provider RPC[web:94]

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(PUBLIC_RPC_URL),
});

// Base Sepolia USDC test token (verify in Circle docs!)
export const USDC_BASE_SEPOLIA =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e';[web:73][web:82]
```

### 5.3 Create a Smart Account and bundler client

Follow Pimlico’s Base Sepolia + ERC‑20 paymaster tutorial structure:[16]

```ts
// src/account.ts
import { createBundlerClient } from '@pimlico/sdk';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createSmartAccountClient } from 'permissionless'; // exact import may vary

const privateKey = process.env.PRIVATE_KEY as `0x${string}`; // dev-only key
const owner = privateKeyToAccount(privateKey);

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

const pimlicoUrl = `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${process.env.PIMLICO_API_KEY}`;

export const bundlerClient = createBundlerClient({
  chain: baseSepolia,
  transport: http(pimlicoUrl),
});

export const smartAccount = await createSmartAccountClient({
  publicClient,
  owner,
  // entryPoint / account factory config as in Pimlico tutorial…
});
```

This mirrors Pimlico’s “ERC‑20 paymaster on Base Sepolia” example, just with your config and API key.[17][16]

### 5.4 Plug in Circle Paymaster

From Circle’s Paymaster quickstart:[1][2][3]

- You obtain the **Circle Paymaster v0.7 address** for your chain from Circle’s Paymaster docs.  
- You build a **UserOperation** that:  
  - Calls your target function (e.g. USDC transfer or your contract).  
  - Includes `paymasterAndData` with encoded info telling Circle Paymaster which token (USDC) and max USDC to spend on gas.

Circle’s example encoding (simplified) looks like this:[2]

```ts
import { encodePacked } from 'viem';

const circleTokenPaymaster = process.env.CIRCLE_PAYMASTER_ADDRESS as `0x${string}`;

// Max 1 USDC (6 decimals) for gas
const maxGasToken = 1_000_000n;

const paymasterAndData = encodePacked(
  ['address', 'address', 'uint256', 'bytes'],
  [
    circleTokenPaymaster,              // Paymaster address
    USDC_BASE_SEPOLIA as `0x${string}`,// Gas token (USDC)
    maxGasToken,                       // Max USDC to spend on gas
    '0x',                              // Reserved / extra data (e.g., EIP‑2612 permit)
  ]
);
```

In the **full Circle example**, that last `bytes` usually carries an **EIP‑2612 permit** signature authorizing the Paymaster to spend the user’s USDC; Circle’s quickstart shows how to build and sign that permit and attach it in `paymasterAndData`.[18][3][1][2]

### 5.5 Build and send the UserOperation

Now compose the UserOp via Pimlico, referencing `paymasterAndData`:

```ts
import { smartAccount, bundlerClient } from './account';
import { encodeFunctionData } from 'viem';
import { USDC_BASE_SEPOLIA } from './config';
import usdcAbi from './abis/usdc.json'; // standard ERC20 ABI

async function sendUsdcWithPaymaster(
  to: `0x${string}`,
  amount: bigint
) {
  const callData = encodeFunctionData({
    abi: usdcAbi,
    functionName: 'transfer',
    args: [to, amount],
  });

  const userOp = await smartAccount.buildUserOperation({
    target: USDC_BASE_SEPOLIA as `0x${string}`,
    data: callData,
    // add paymaster data
    paymasterAndData,
  });

  const userOpHash = await bundlerClient.sendUserOperation(userOp);
  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

  console.log('UserOp hash:', userOpHash);
  console.log('Tx hash:', receipt.transactionHash);
}
```

That flow is exactly what Circle and Arbitrum docs describe: a UserOp carrying a token transfer plus Circle Paymaster metadata, sent via a bundler, with gas ultimately paid in USDC instead of native ETH.[3][1][16]

***

## 6. How this ties into your AgenticSCM agent

For your **JS/TS + Base Sepolia** hackathon build:

1. **Circle Wallets**  
   - Use the **dev‑controlled SDK** to:
     - Create a **wallet set** (`BASE-SEPOLIA`).  
     - Create **buyer/supplier wallets** in that set.  
     - Fund buyer wallet with Base Sepolia USDC via Circle faucet.[8][11][6][4]

2. **Circle Paymaster**  
   - Spin up a 4337 **smart account** on Base Sepolia (Safe, Coinbase Smart Wallet, or permissionless.js).  
   - Integrate **Circle Paymaster** on Base Sepolia by:
     - Using the Base Sepolia **USDC address**.  
     - Using Circle’s Paymaster address for Base Sepolia.  
     - Encoding `paymasterAndData` as in the quickstart, with EIP‑2612 permit.[14][1][2][3]

3. **Agent**  
   - Your Gemini / GLM‑5 agent decides when to pay, then:
     - Either calls Circle Wallets API for a simple dev‑controlled transfer (if you’re okay funding gas with test ETH).  
     - Or, for the “gas in USDC” story, calls your 4337 + Paymaster flow to send USDC from the smart account with **no native ETH needed**.

If you want, I can next turn this into a **ready-to-paste `scripts/` folder** for your repo (one script to create the wallet set, one to create wallets, one to send USDC via Paymaster on Base Sepolia).

Citations:
[1] [Circle Paymaster quickstart - Arbitrum Docs](https://docs.arbitrum.io/for-devs/third-party-docs/Circle/usdc-paymaster-quickstart)  
[2] [Circle Paymaster | Allow Users to Pay Gas Fees with USDC](https://www.circle.com/paymaster)  
[3] [Quickstart: Circle Paymaster](https://developers.circle.com/paymaster/pay-gas-fees-usdc)  
[4] [Supported Blockchains - Circle Docs](https://developers.circle.com/w3s/supported-blockchains-and-currencies)  
[5] [Create Developer-Controlled SCA Wallets](https://circleu.com/topics/create-developer-controlled-sca-wallets/)  
[6] [Using Circle Developer Controlled Wallets to Send and Manage ...](https://www.youtube.com/watch?v=GmbXPVMxyzQ)  
[7] [Deploying Developer-Controlled Wallets – A Quickstart Guide - Circle](https://www.circle.com/developer/walkthroughs-tutorials/deploying-developer-controlled-wallets---a-quickstart-guide-programmable-wallets)  
[8] [Working With Dev Controlled Wallets | Learn everything about Circle ...](https://www.risein.com/courses/build-on-chain-with-circle-and-usdc/working-with-dev-controlled-wallets)  
[9] [Create wallets - Circle Developer Docs](https://developers.circle.com/api-reference/wallets/developer-controlled-wallets/create-wallet)  
[10] [circlefin/arc-multichain-wallet - GitHub](https://github.com/circlefin/arc-multichain-wallet)  
[11] [Testnet Faucet | Circle](https://faucet.circle.com)  
[12] [Developer Marketing Outlook 2025: Unlocking mainstream stablecoin adoption through education](https://www.circle.com/es-la/blog/upcoming-support-for-sepolia-test-networks)  
[13] [Circle on X: "8/ Testnet Faucet Developers can start to experiment ...](https://x.com/circle/status/1810639689373933720)  
[14] [Circle Docs and On-Chain Verification - 7Block Labs](https://www.7blocklabs.com/blog/base-usdc-contract-address-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913-circle-docs-and-on-chain-verification)  
[15] [USDC Contract Address on Base and Base USDC Address Variants](https://www.7blocklabs.com/blog/usdc-contract-address-on-base-and-base-usdc-address-variants-avoiding-fake-contract-traps)  
[16] [Submit a user operation with an ERC-20 Paymaster](https://docs.pimlico.io/guides/tutorials/tutorial-2)  
[17] [Connecting to Base - Base Documentation](https://docs.base.org/base-chain/quickstart/connecting-to-base)  
[18] [Enable users to pay gas fees with USDC using Circle Paymaster.](https://www.circle.com/blog/how-to-integrate-circle-paymaster-to-enable-users-to-pay-gas-fees-with-their-usdc-balance)  
[19] [Quickstart: Submit your first sponsored smart account transaction](https://docs.base.org/builderkits/onchainkit/paymaster/quickstart-headless)  
[20] [Using Circle Developer Controlled Wallets - The Arc Community](https://community.arc.network/public/videos/using-circle-developer-controlled-wallets-to-send-and-manage-usdc-2026-01-20)  
[21] [Submit your first sponsored smart account transaction](https://docs.cdp.coinbase.com/paymaster/guides/quickstart)  
[22] [USDC Contract Address: Official Addresses for Every Blockchain](https://www.mexc.co/en-IN/learn/article/usdc-contract-address-official-addresses-for-every-blockchain/1)  
[23] [Create wallets - Circle Developer Docs](https://developers.circle.com/api-reference/wallets/user-controlled-wallets/create-user-wallet)  
[24] [Circle Adds $USDC and $EURC to Sepolia Test Networks](https://cryptopulpit.com/circle-adds-usdc-and-eurc-to-sepolia-test-networks/)  
[25] [Circle Adds $USDC And $EURC To Sepolia Test Networks](https://blockchainreporter.net/circle-adds-usdc-and-eurc-to-sepolia-test-networks/)  
[26] [DePay | ETHGlobal](https://ethglobal.com/showcase/depay-1eftc)  
[27] [Wallets - Circle Docs](https://developers.circle.com/wallets)  
[28] [Account Types - Circle Developer Docs](https://developers.circle.com/wallets/account-types)  
[29] [Wallet as a Service | Circle](https://www.circle.com/wallets)  
[30] [Circle USDC Sepolia Faucet: Get Testnet Funds](https://experience.rockfeller.com.br/key-speak/circle-usdc-sepolia-faucet-get-testnet-funds-1764801675)  
[31] [What Is Arc Blockchain? The Definitive Guide to Circle's Stablecoin ...](https://payram.com/blog/what-is-arc-blockchain-the-definitive-guide-to-circles-stablecoin-superhighway)