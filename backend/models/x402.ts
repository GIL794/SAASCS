// x402 Payment Request/Confirmation Schema
export interface X402PaymentRequest {
  source_wallet_id: string;
  destination_wallet_id: string;
  asset: string;
  amount: number;
  shipment_ref: string;
  invoice_ref?: string;
  metadata?: Record<string, any>;
}

export interface X402PaymentConfirmation {
  status: 'confirmed' | 'failed';
  transaction_hash: string;
  arc_explorer_url: string;
  payment_timestamp: string;
  details?: Record<string, any>;
}

// Factory for X402 Payment Request
export function createX402PaymentRequest(params: {
  source_wallet_id: string;
  destination_wallet_id: string;
  asset: string;
  amount: number;
  shipment_ref: string;
  invoice_ref?: string;
  metadata?: Record<string, any>;
}): X402PaymentRequest {
  return {
    source_wallet_id: params.source_wallet_id,
    destination_wallet_id: params.destination_wallet_id,
    asset: params.asset,
    amount: params.amount,
    shipment_ref: params.shipment_ref,
    invoice_ref: params.invoice_ref,
    metadata: params.metadata,
  };
}

// Factory for X402 Payment Confirmation
export function createX402PaymentConfirmation(params: {
  status: 'confirmed' | 'failed';
  transaction_hash: string;
  arc_explorer_url: string;
  payment_timestamp: string;
  details?: Record<string, any>;
}): X402PaymentConfirmation {
  return {
    status: params.status,
    transaction_hash: params.transaction_hash,
    arc_explorer_url: params.arc_explorer_url,
    payment_timestamp: params.payment_timestamp,
    details: params.details,
  };
}