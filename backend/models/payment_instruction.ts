// Payment Instruction Schema
export interface PaymentInstruction {
  source_wallet_id: string;
  destination_wallet_id: string;
  asset: string; // USDC, EURC, etc.
  amount: number;
  fx_required: boolean;
  fx_from_asset?: string;
  fx_to_asset?: string;
  shipment_ref: string;
  invoice_ref?: string;
  metadata?: Record<string, any>;
}

// Factory for Payment Instruction
export function createPaymentInstruction(params: {
  source_wallet_id: string;
  destination_wallet_id: string;
  asset: string;
  amount: number;
  fx_required: boolean;
  fx_from_asset?: string;
  fx_to_asset?: string;
  shipment_ref: string;
  invoice_ref?: string;
  metadata?: Record<string, any>;
}): PaymentInstruction {
  return {
    source_wallet_id: params.source_wallet_id,
    destination_wallet_id: params.destination_wallet_id,
    asset: params.asset,
    amount: params.amount,
    fx_required: params.fx_required,
    fx_from_asset: params.fx_from_asset,
    fx_to_asset: params.fx_to_asset,
    shipment_ref: params.shipment_ref,
    invoice_ref: params.invoice_ref,
    metadata: params.metadata,
  };
}