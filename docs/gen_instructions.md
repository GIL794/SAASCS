Here’s a practical, hackathon-friendly, **step‑by‑step** way to:  
1) get a **Wallet Set ID** for Circle developer‑controlled wallets, and  
2) set up **Circle Paymaster** so users can pay gas in USDC.

***

## Part 1 – Create a Wallet Set and get the Wallet Set ID

### Step 0 – Prerequisites

1. Create a **Circle Developer account** and log into the **Circle Console**.[1][2]
2. In Console, generate an **API key** (Developer → API keys) and store it in `.env` as `CIRCLE_API_KEY`.[1]
3. Follow the dev‑controlled wallet quickstart to create an **Entity Secret** and register it (either via their interactive quickstart, SDK, or scripts).[3][4][1]
   - Store it as `CIRCLE_ENTITY_SECRET` in your `.env`.

At this point you should have:  
- `CIRCLE_API_KEY`  
- `CIRCLE_ENTITY_SECRET`  
- A recovery file downloaded from Console (keep it safe).[3][1]

### Step 1 – Install the SDK / choose how to call

For TypeScript/Node, install the Programmable Wallets SDK (or use raw REST):[2][3][1]

```bash
npm install @circle-fin/w3s-wallets axios
```

For Python, you can use `requests` or an unofficial helper; the flow is the same (HTTP calls to Circle Wallets API).[2][3]

### Step 2 – Initialize the dev‑controlled wallets client

Example (TypeScript):

```ts
import { DevControlledWalletsClient } from '@circle-fin/w3s-wallets';
import 'dotenv/config';

const client = new DevControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});
```

This matches the pattern shown in Circle’s tutorials and videos: initialize the SDK with API key and entity secret, then call wallet functions.[5][3][1]

### Step 3 – Create a Wallet Set

A **wallet set** is a logical group of wallets that share the same cryptographic root; you must create one before creating wallets.[3][1]

Using the SDK:

```ts
const res = await client.createWalletSet({
  name: 'agentic-scm-wallet-set',
});

console.log(res);
```

The response includes at least:

```json
{
  "id": "ws_test_1234567890",
  "name": "agentic-scm-wallet-set",
  ...
}
```

- Copy the `id` – that is your **Wallet Set ID**.  
- Put it into `.env` as:

```bash
WALLET_SET_ID=ws_test_1234567890
```

Tutorials and quickstarts explicitly highlight this step: call `createWalletSet`, then store the returned `id`.[5][1][3]

### Step 4 – Create wallets inside the Wallet Set

Now create buyer/supplier wallets for your AgenticSCM flows:[1][2][3]

```ts
const walletsRes = await client.createWallets({
  walletSetId: process.env.WALLET_SET_ID!,
  count: 2,
  blockchain: 'EVM-<network>', // e.g. 'EVM-ARBITRUM-SEPOLIA', 'EVM-BASE-SEPOLIA'
});

console.log(walletsRes);
```

The response contains wallet IDs and addresses; save them in `.env`:

```bash
BUYER_WALLET_ID=...
SUPPLIER_WALLET_ID=...
```

You can then use the Circle **faucet** in Console to fund a testnet wallet with USDC and the native gas token if needed.[3][1]

***

## Part 2 – Set up Circle Paymaster (gas in USDC)

Circle **Paymaster** lets users pay gas fees in USDC instead of the native token, implemented as an ERC‑4337 paymaster contract run by Circle.[6][7][8][9]

### Step 0 – Understand the moving pieces

- **Your smart account / wallet (e.g., 4337 smart wallet or EOA+7702)** sends a **UserOperation (UserOp)**.  
- The UserOp references Circle’s **Paymaster contract address** on the target chain.[7][8][10]
- The user signs an **EIP‑2612 permit** that authorizes the Paymaster to spend a small amount of their USDC for gas.[8][9][7]
- A **bundler** (e.g., Pimlico or Alchemy) submits the UserOp with that paymaster data to the network.[10][11][7]

Circle’s docs and blog outline this sequence and provide the paymaster contract address per chain.[9][7][8]

### Step 1 – Get Paymaster addresses and network support

1. Choose your network (e.g. **Arbitrum**, **Base**, or other supported EVMs). Early support is on Arbitrum and Base, with more chains rolling out.[6][7][8]
2. From Circle Paymaster or Arbitrum quickstart docs, copy:
   - `USDC_TOKEN_ADDRESS`
   - `CIRCLE_PAYMASTER_ADDRESS` (sometimes named `circleTokenPaymaster`)[7][8][9]

Add to `.env`:

```bash
USDC_TOKEN_ADDRESS=0x...
CIRCLE_PAYMASTER_ADDRESS=0x...
```

### Step 2 – Create an EIP‑2612 permit for USDC

Before each transaction, you need a signed **permit** allowing the Paymaster to spend a capped amount of USDC (e.g. 1 USDC) for gas.[8][9][7]

Typical pattern (pseudo‑TypeScript, following Circle’s docs):

```ts
const { signature: permitSignature } = await account.signTypedData(
  await constructEIP2612Permit({
    token: USDC_TOKEN_ADDRESS,
    chain: currentChain,
    ownerAddress: account.address,
    spenderAddress: CIRCLE_PAYMASTER_ADDRESS,
    value: 1_000_000, // 1 USDC with 6 decimals
  })
);
```

This mirrors code samples in Circle’s Paymaster docs where they construct an EIP‑2612 permit and have the user sign it off‑chain.[9][8]

### Step 3 – Encode Paymaster data for the UserOperation

You then encode the paymaster data that includes:

- Paymaster address.  
- Permit signature.  
- Allowance amount, expiration, etc.

Circle’s examples show helper functions to construct this `paymasterData` blob, which you pass into the UserOp.[11][7][8][9]

Conceptually:

```ts
const paymasterData = encodeCirclePaymasterData({
  paymasterAddress: CIRCLE_PAYMASTER_ADDRESS,
  permitSignature,
  maxUsdcForGas: 1_000_000,
});
```

### Step 4 – Build and submit the UserOperation with a bundler

Use a bundler SDK (e.g. Pimlico) to build a UserOp that:

- Performs your **actual USDC transfer / contract call** from the smart account.  
- Sets:
  - `paymasterAndData` (or equivalent) to the encoded data above.  
- Uses your chosen chain and bundler RPC.[10][11][7]

Pseudo‑flow (following Arbitrum & Circle examples):

```ts
const userOp = await bundlerClient.createUserOperation({
  sender: smartAccount.address,
  callData: encodedTransferOrContractCall,
  paymasterAndData: paymasterData,
  // other gas / nonce fields...
});

const userOpHash = await bundlerClient.sendUserOperation(userOp);
const txHash = await bundlerClient.waitForUserOperationTransaction(userOpHash);
console.log('Tx hash:', txHash);
```

Circle’s quickstarts show almost this exact pattern with Pimlico as the bundler.[11][7]

### Step 5 – What Circle Paymaster does behind the scenes

On-chain / under the hood, Paymaster:[7][8][9]

1. Verifies the user’s **USDC balance** using `balanceOf(address)`.  
2. Converts needed gas to USDC using a **price feed** (`fetchPrice()` or similar).  
3. Validates the UserOp + EIP‑2612 permit in `_validatePaymasterUserOp`.  
4. After execution, debits USDC via `_postOp()`, swaps it for the native gas token, and pays the bundler/network.[10][9][7]

You do **not** have to manage native gas tokens for the user; they only need USDC.

***

## Minimal integration checklist for your project

For your AgenticSCM agent:

1. **Wallet Set + IDs**
   - Create Entity Secret + API key in Circle Console.  
   - Use SDK or REST to call `createWalletSet` → save `WALLET_SET_ID`.  
   - Call `createWallets` with that set ID → save `BUYER_WALLET_ID` / `SUPPLIER_WALLET_ID`.[2][1][3]

2. **Fund Wallet(s) and configure Paymaster**
   - Use Circle faucet (for dev) to put USDC into the buyer wallet.[1][3]
   - Get `USDC_TOKEN_ADDRESS` and `CIRCLE_PAYMASTER_ADDRESS` for your testnet chain.[8][7]

3. **Wire Paymaster into your transaction flow**
   - Build an EIP‑2612 permit for USDC → Paymaster.  
   - Encode `paymasterAndData`.  
   - Build a UserOp for “send USDC from buyer wallet” or “execute contract call” that includes that paymaster data.  
   - Submit via bundler (Pimlico/Alchemy) and wait for tx hash.[9][11][7][8]

If you tell me your **language (TS vs Python)** and **target network (e.g., Arbitrum testnet vs Base testnet)**, I can sketch a concrete code skeleton for both the wallet‑set creation script and a Paymaster‑backed transfer.

Citations:
[1] [Using Circle Developer Controlled Wallets to Send and Manage USDC](https://www.youtube.com/watch?v=GmbXPVMxyzQ)  
[2] [Wallets - Circle Developer Docs](https://developers.circle.com/wallets)  
[3] [Working With Dev Controlled Wallets | Learn everything about Circle ...](https://www.risein.com/courses/build-on-chain-with-circle-and-usdc/working-with-dev-controlled-wallets)  
[4] [Deploying Developer-Controlled Wallets – A Quickstart Guide - Circle](https://www.circle.com/developer/walkthroughs-tutorials/deploying-developer-controlled-wallets---a-quickstart-guide-programmable-wallets)  
[5] [Deploying Developer-Controlled Wallets – A Quickstart Guide](https://www.youtube.com/watch?v=17hOaMNf87s)  
[6] [Circle launches Paymaster, enabling users to pay gas fees with USDC](https://cryptobriefing.com/circle-usdc-gas-fee-paymaster/)  
[7] [Circle Paymaster quickstart | Arbitrum Docs](https://docs.arbitrum.io/for-devs/third-party-docs/Circle/usdc-paymaster-quickstart)  
[8] [Circle Paymaster | Allow Users to Pay Gas Fees with USDC](https://www.circle.com/paymaster)  
[9] [Enable users to pay gas fees with USDC using Circle Paymaster.](https://www.circle.com/blog/how-to-integrate-circle-paymaster-to-enable-users-to-pay-gas-fees-with-their-usdc-balance)  
[10] [Examples and SDKs - ERC-4337 Documentation](https://docs.erc4337.io/paymasters/examples-and-sdks.html)  
[11] [Building an EIP-7702 EOA Wallet with Circle Paymaster - YouTube](https://www.youtube.com/watch?v=ImhVA-esinY)  
[12] [Wallets: Dev-Controlled - Circle Developer Docs](https://developers.circle.com/wallets/dev-controlled)  
[13] [Introducing the Circle Programmable Wallets Web SDK](https://www.circle.com/blog/introducing-the-circle-programmable-wallets-web-sdk)  
[14] [Getting Started with User-Controlled Wallets | Circle Wallets](https://www.youtube.com/watch?v=jk1RanSFjxo)  
[15] [Introducing Circle Paymaster: Pay gas fees in USDC](https://www.circle.com/blog/introducing-circle-paymaster)