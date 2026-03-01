'use client';

import * as React from 'react';
import { Package, MapPin, User, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Shipment {
  shipment_id: string;
  buyer_id: string;
  supplier_id: string;
  delivery_location: string;
  status?: 'pending' | 'in-transit' | 'delivered' | 'paid';
}

const statusConfig = {
  pending:    { label: 'Pending',    variant: 'warning'   as const, dot: 'bg-amber-400' },
  'in-transit': { label: 'In Transit', variant: 'info'    as const, dot: 'bg-blue-400 animate-pulse' },
  delivered:  { label: 'Delivered',  variant: 'success'   as const, dot: 'bg-emerald-400' },
  paid:       { label: 'Paid',       variant: 'confirmed' as const, dot: 'bg-cyan-400' },
};

interface ShipmentTableProps {
  shipments?: Shipment[];
  isLoading?: boolean;
  onTriggerEvent?: (shipmentId: string) => void;
}

export function ShipmentTable({
  shipments = [],
  isLoading = false,
  onTriggerEvent,
}: ShipmentTableProps) {
  // Enrich with mock statuses for demo
  const enriched = shipments.map((s, i) => ({
    ...s,
    status: (s.status ?? (['pending', 'in-transit', 'delivered', 'paid'][i % 4])) as Shipment['status'],
  }));

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Active Shipments</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {shipments.length} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-md shimmer" />
            ))}
          </div>
        ) : enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No shipments found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start the IoT simulator to generate events
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {enriched.map((shipment) => {
              const status = statusConfig[shipment.status ?? 'pending'];
              return (
                <div
                  key={shipment.shipment_id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  {/* Status dot */}
                  <span className={cn('status-dot shrink-0', status.dot)} />

                  {/* Shipment info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono text-foreground font-medium">
                        {shipment.shipment_id}
                      </span>
                      <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        {shipment.buyer_id} → {shipment.supplier_id}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {shipment.delivery_location}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onTriggerEvent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTriggerEvent(shipment.shipment_id)}
                        className="h-7 text-[11px] border-primary/30 text-primary hover:bg-primary/10"
                      >
                        Trigger Event
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <a
                        href={`https://arc-explorer.example.com/shipment/${shipment.shipment_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
