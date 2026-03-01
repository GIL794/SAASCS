import { stablefxConfig } from '../config/stablefx';
import axios from 'axios';

// Detect invoice currency and call StableFX
export async function requestFXQuote(fromAsset: string, toAsset: string, amount: number) {
  return axios.post(`${stablefxConfig.endpoint}/rfq`, {
    fromAsset,
    toAsset,
    amount
  }, {
    headers: { 'Authorization': `Bearer ${stablefxConfig.apiKey}` }
  });
}

export async function acceptFXQuote(quoteId: string) {
  return axios.post(`${stablefxConfig.endpoint}/accept`, {
    quoteId
  }, {
    headers: { 'Authorization': `Bearer ${stablefxConfig.apiKey}` }
  });
}

// Example ledger update
export function updateLedger(paymentId: string, fxDetails: any) {
  console.log('FX_SWAP_EXECUTED', { paymentId, ...fxDetails });
}