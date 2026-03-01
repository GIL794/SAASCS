#!/usr/bin/env node
import 'dotenv/config';

async function main() {
  const MOCK = process.env.MOCK_CIRCLE === 'true';

  if (MOCK) {
    console.log('MOCK mode enabled — showing example paymasterAndData for Base Sepolia');
    console.log('paymasterAndData (example): 0xdeadbeef...');
    return;
  }

  let encodePacked: any;

  try {
    // Use dynamic import to avoid require() in ES module context
    const viem = await import('viem');
    encodePacked = viem.encodePacked;
  } catch (err) {
    console.error('Missing `viem` package. Install with `npm install viem` or use MOCK_CIRCLE=true to run a mock.');
    console.error('Error:', (err as any).message ?? err);
    process.exit(1);
  }

  const {
    CIRCLE_PAYMASTER_ADDRESS,
    USDC_BASE_SEPOLIA,
  } = process.env;

  if (!CIRCLE_PAYMASTER_ADDRESS || !USDC_BASE_SEPOLIA) {
    console.error('Missing required env vars: CIRCLE_PAYMASTER_ADDRESS, USDC_BASE_SEPOLIA');
    console.error('See scripts/.env.example');
    process.exit(1);
  }

  const circleTokenPaymaster = CIRCLE_PAYMASTER_ADDRESS as `0x${string}`;
  const usdcAddress = USDC_BASE_SEPOLIA as `0x${string}`;
  const maxGasToken = BigInt(1_000_000);

  const paymasterAndData = encodePacked(
    ['address', 'address', 'uint256', 'bytes'],
    [circleTokenPaymaster, usdcAddress, maxGasToken, '0x']
  );

  console.log('paymasterAndData (example):', paymasterAndData);
  console.log('\nFull Circle Paymaster flow requires (see docs/testnet-instruction.md):');
  console.log('1. Create SmartAccount client (permissionless.js or Safe)');
  console.log('2. Build UserOperation with ERC-20 USDC transfer call');
  console.log('3. Attach paymasterAndData with EIP-2612 permit signature');
  console.log('4. Send via Pimlico bundler');
}

main().catch((e) => {
  console.error('Error:', (e as any).message ?? e);
  process.exit(1);
});
