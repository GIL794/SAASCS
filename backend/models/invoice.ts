// Invoice Object Schema
export interface Invoice {
  invoice_id: string;
  buyer: string;
  supplier: string;
  currency: string; // e.g., USDC, EURC, CNYC
  amount: number;
  language: string; // e.g., en, es, zh
  due_date: string; // ISO8601
  line_items: Array<{ description: string; quantity: number; unit_price: number; }>
  attached_files: string[]; // URLs
}

// Multilingual Invoice Factory
export function createInvoice(params: {
  invoice_id: string;
  buyer: string;
  supplier: string;
  currency: string;
  amount: number;
  language: 'en' | 'es' | 'zh';
  due_date: string;
  attached_files: string[];
}): Invoice {
  let line_items: { description: string; quantity: number; unit_price: number }[];
  switch (params.language) {
    case 'en':
      line_items = [{ description: 'Widgets', quantity: 100, unit_price: 10 }];
      break;
    case 'es':
      line_items = [{ description: 'Piezas', quantity: 90, unit_price: 10 }];
      break;
    case 'zh':
      line_items = [{ description: '零件', quantity: 100, unit_price: 70 }];
      break;
    default:
      line_items = [];
  }
  return {
    invoice_id: params.invoice_id,
    buyer: params.buyer,
    supplier: params.supplier,
    currency: params.currency,
    amount: params.amount,
    language: params.language,
    due_date: params.due_date,
    line_items,
    attached_files: params.attached_files,
  };
}