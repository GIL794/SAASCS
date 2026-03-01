import fs from 'fs';
import path from 'path';
import axios from 'axios';

const shipments = JSON.parse(fs.readFileSync(path.join(__dirname, 'shipments.json'), 'utf-8'));

function emitEvent(shipment: any) {
  const event = {
    event_type: 'CargoDelivered',
    timestamp: new Date().toISOString(),
    shipment_id: shipment.shipment_id,
    buyer_id: shipment.buyer_id,
    supplier_id: shipment.supplier_id,
    delivery_location: shipment.delivery_location,
    proof_type: 'GPS',
    proof_payload: JSON.stringify({ lat: 51.5074, lng: -0.1278 })
  };
  // Send event to agent
  axios.post('http://localhost:8000/events', event)
    .then(res => console.log('Event sent:', event))
    .catch(err => console.error('Error sending event:', err));
}

// CLI mode
const shipmentId = process.argv[2];
if (shipmentId) {
  const shipment = shipments.find((s: any) => s.shipment_id === shipmentId);
  if (shipment) emitEvent(shipment);
  else console.error('Shipment not found');
} else {
  // Loop mode: emit every 30s
  let idx = 0;
  setInterval(() => {
    emitEvent(shipments[idx % shipments.length]);
    idx++;
  }, 30000);
}