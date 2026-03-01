#!/usr/bin/env node
import 'dotenv/config';

async function main() {
  const MOCK = process.env.MOCK_CIRCLE === 'true';

  if (MOCK) {
    console.log('MOCK mode enabled — simulating wallet creation.');
    const mock = [
      { id: 'w_mock_buyer_1', address: '0x000000000000000000000000000000000000babe' },
      { id: 'w_mock_supplier_1', address: '0x000000000000000000000000000000000000feed' },
    ];
    console.log(JSON.stringify(mock, null, 2));
    console.log('\nSave BUYER_WALLET_ID and SUPPLIER_WALLET_ID to your .env with the mock ids.');
    return;
  }

  const { CIRCLE_API_KEY, WALLET_SET_ID } = process.env;
  if (!CIRCLE_API_KEY || !WALLET_SET_ID) {
    console.error('Missing required env vars: CIRCLE_API_KEY, WALLET_SET_ID');
    console.error('Copy scripts/.env.example to scripts/.env and fill in values.');
    process.exit(1);
  }

  const url = `https://api.circle.com/v1/w3s/wallets`;
  const payload = {
    walletSetId: WALLET_SET_ID,
    count: Number(process.env.CREATE_WALLET_COUNT ?? '2'),
    blockchain: process.env.CIRCLE_BLOCKCHAIN ?? 'BASE-SEPOLIA',
    name: process.env.CREATE_WALLET_NAME ?? 'agentic-scm-wallet',
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
    console.log('Wallets created:', JSON.stringify(data.data, null, 2));
    console.log('\nSave BUYER_WALLET_ID/ADDRESS and SUPPLIER_WALLET_ID/ADDRESS in your .env');
  } catch (err) {
    console.error('Error creating wallets:', (err as any).message ?? err);
    process.exit(1);
  }
}

main();
