#!/usr/bin/env node
import 'dotenv/config';

async function main() {
  const MOCK = process.env.MOCK_CIRCLE === 'true';

  if (MOCK) {
    console.log('MOCK mode enabled — simulating wallet set creation.');
    console.log(JSON.stringify({ id: 'ws_test_mock_123', name: process.env.WALLET_SET_NAME ?? 'agentic-scm-wallet-set' }, null, 2));
    console.log('\nSet `WALLET_SET_ID=ws_test_mock_123` in your .env to continue with mocks.');
    return;
  }

  const { CIRCLE_API_KEY } = process.env;
  if (!CIRCLE_API_KEY) {
    console.error('Missing CIRCLE_API_KEY in environment');
    console.error('Copy scripts/.env.example to scripts/.env and fill in your Circle API key.');
    process.exit(1);
  }

  const url = 'https://api.circle.com/v1/w3s/wallet_sets';
  const payload = {
    name: process.env.WALLET_SET_NAME ?? 'agentic-scm-wallet-set',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Circle API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    console.log('Wallet set created:', JSON.stringify(data.data, null, 2));
    console.log('\nSet `WALLET_SET_ID` to the `id` value above in your .env');
  } catch (err) {
    console.error('Error creating wallet set:', (err as any).message ?? err);
    process.exit(1);
  }
}

main();
