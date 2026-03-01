// IoT Delivery Event Schema
export interface IoTDeliveryEvent {
  event_type: 'CargoDelivered';
  timestamp: string; // ISO8601
  shipment_id: string;
  buyer_id: string;
  supplier_id: string;
  delivery_location: string;
  proof_type: string;
  proof_payload: string; // e.g., URL, GPS JSON
}

// Factory for IoT Delivery Event
export function createIoTDeliveryEvent(params: {
  event_type?: 'CargoDelivered';
  timestamp: string;
  shipment_id: string;
  buyer_id: string;
  supplier_id: string;
  delivery_location: string;
  proof_type: string;
  proof_payload: string;
}): IoTDeliveryEvent {
  return {
    event_type: params.event_type || 'CargoDelivered',
    timestamp: params.timestamp,
    shipment_id: params.shipment_id,
    buyer_id: params.buyer_id,
    supplier_id: params.supplier_id,
    delivery_location: params.delivery_location,
    proof_type: params.proof_type,
    proof_payload: params.proof_payload,
  };
}