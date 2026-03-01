import { circleConfig } from '../config/circle';
import { arcConfig } from '../config/arc';
import axios from 'axios';

// Create buyer/supplier wallets (dev-controlled)
export async function createWallet(type: 'buyer' | 'supplier') {
  return axios.post('https://api.circle.com/v1/wallets', {
    walletSetId: circleConfig.walletSetId,
    type
  }, {
    headers: { 'Authorization': `Bearer ${circleConfig.apiKey}` }
  });
}

// Fund wallets (testnet)
export async function fundWallet(walletId: string, amount: number, asset: string) {
  // Use faucet or internal funding API
  return axios.post('https://arc-testnet.example.com/faucet', {
    walletId,
    amount,
    asset
  });
}

// Prepare and send payment transaction
export async function sendPayment(instruction: any) {
  return axios.post('https://api.circle.com/v1/payments', {
    sourceWalletId: instruction.source_wallet_id,
    destinationWalletId: instruction.destination_wallet_id,
    asset: instruction.asset,
    amount: instruction.amount,
    metadata: instruction.metadata,
    paymasterConfig: circleConfig.paymasterConfig
  }, {
    headers: { 'Authorization': `Bearer ${circleConfig.apiKey}` }
  });
}

// Gas sponsorship via Paymaster
export function configurePaymaster() {
  // Example: set paymaster config in Circle
  return circleConfig.paymasterConfig;
}

// Payment confirmation
export async function confirmPayment(txHash: string) {
  // Query Arc explorer
  return axios.get(`https://arc-explorer.example.com/tx/${txHash}`);
}