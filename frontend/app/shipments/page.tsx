'use client';

import * as React from 'react';
import {
  Package,
  RefreshCw,
  Zap,
  MapPin,
  User,
  Building2,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  CircleDot,
  Play,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatTimestamp } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Shipment {
  shipment_id: string;
  buyer_id: string;
  supplier_id: string;
  delivery_location: string;
  status?: 'pending' | 'in-transit' | 'delivered' | 'paid' | 'failed';
  last_event?: string;
}

interface LogEntry {
  type: string;
  timestamp: string;
  data: Record<string, any>;
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  pending:    { label: 'Pending',    icon: CircleDot,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   dot: 'bg-amber-400' },
  'in-transit': { label: 'In Transit', icon: Truck,        color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',     dot: 'bg-blue-400' },
  delivered:  { label: 'Delivered',  icon: Package,      color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30', dot: 'bg-violet-400' },
  paid:       { label: 'Paid',       icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  failed:     { label: 'Failed',     icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',       dot: 'bg-red-400' },
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Shipment row ──────────────────────────────────────────────────────────────
function ShipmentRow({
  shipment,
  onTrigger,
  triggering,
}: {
  shipment: Shipment;
  onTrigger: (id: string) => void;
  triggering: boolean;
}) {
  const status = shipment.status ?? 'pending';
  const cfg = statusConfig[status] ?? statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card/60 hover:bg-card p-4 transition-all duration-150 animate-fade-in">
      {/* Shipment ID + status */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Package className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-foreground truncate">
            {shipment.shipment_id}
          </p>
          {shipment.last_event && (
            <p className="text-[10px] text-muted-foreground truncate">
              Last: {shipment.last_event}
            </p>
          )}
        </div>
      </div>

      {/* Buyer → Supplier */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 sm:w-48">
        <User className="h-3 w-3 shrink-0 text-blue-400" />
        <span className="truncate">{shipment.buyer_id}</span>
        <span className="text-border">→</span>
        <Building2 className="h-3 w-3 shrink-0 text-cyan-400" />
        <span className="truncate">{shipment.supplier_id}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:w-36">
        <MapPin className="h-3 w-3 shrink-0 text-violet-400" />
        <span className="truncate">{shipment.delivery_location}</span>
      </div>

      {/* Status badge */}
      <div className="sm:w-28">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
          cfg.bg, cfg.color
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {/* Trigger button */}
      <div className="sm:w-36 flex justify-end">
        <Button
          size="sm"
          variant={status === 'paid' ? 'secondary' : 'default'}
          disabled={status === 'paid' || triggering}
          onClick={() => onTrigger(shipment.shipment_id)}
          className="text-xs gap-1.5 w-full sm:w-auto"
        >
          {triggering ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : status === 'paid' ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {status === 'paid' ? 'Settled' : 'Trigger Event'}
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [triggeringId, setTriggeringId] = React.useState<string | null>(null);
  const [isLive, setIsLive] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');
  const esRef = React.useRef<EventSource | null>(null);

  // ── Fetch shipments ─────────────────────────────────────────────────────────
  const fetchShipments = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/shipments');
      if (res.ok) {
        const data: Shipment[] = await res.json();
        setShipments(data.map(s => ({ ...s, status: s.status ?? 'pending' })));
        setLastUpdated(new Date().toISOString());
      }
    } catch {
      // Fallback demo data
      setShipments([
        { shipment_id: 'SHIP123', buyer_id: 'BUYER001', supplier_id: 'SUPPLIER001', delivery_location: 'London, UK', status: 'delivered' },
        { shipment_id: 'SHIP456', buyer_id: 'BUYER002', supplier_id: 'SUPPLIER002', delivery_location: 'Madrid, Spain', status: 'in-transit' },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ── SSE — update shipment status from log events ────────────────────────────
  const connectSSE = React.useCallback(() => {
    esRef.current?.close();
    const es = new EventSource('/api/logs/stream');
    es.onopen = () => setIsLive(true);
    es.onerror = () => setIsLive(false);
    es.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        const sid = entry.data?.shipment_id;
        if (!sid) return;

        setShipments(prev => prev.map(s => {
          if (s.shipment_id !== sid) return s;
          let newStatus = s.status;
          if (entry.type === 'EVENT_RECEIVED') newStatus = 'delivered';
          if (entry.type === 'PAYMENT_SUBMITTED') newStatus = 'delivered';
          if (entry.type === 'PAYMENT_CONFIRMED') newStatus = 'paid';
          if (entry.type === 'ERROR') newStatus = 'failed';
          return { ...s, status: newStatus, last_event: formatTimestamp(entry.timestamp) };
        }));
      } catch {}
    };
    esRef.current = es;
  }, []);

  React.useEffect(() => {
    fetchShipments();
    connectSSE();
    return () => esRef.current?.close();
  }, [fetchShipments, connectSSE]);

  // ── Trigger delivery event ──────────────────────────────────────────────────
  const triggerEvent = async (shipmentId: string) => {
    setTriggeringId(shipmentId);
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: shipmentId,
          event_type: 'CARGO_DELIVERED',
          delivery_location: shipments.find(s => s.shipment_id === shipmentId)?.delivery_location ?? 'Unknown',
          timestamp: new Date().toISOString(),
          sensor_id: 'IOT_SIM_001',
          temperature_ok: true,
          weight_kg: 1250,
        }),
      });
    } catch {}
    finally {
      setTriggeringId(null);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const counts = React.useMemo(() => ({
    total:     shipments.length,
    pending:   shipments.filter(s => s.status === 'pending').length,
    inTransit: shipments.filter(s => s.status === 'in-transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    paid:      shipments.filter(s => s.status === 'paid').length,
  }), [shipments]);

  return (
    <DashboardLayout
      title="Shipments"
      subtitle="Active shipments on Arc Testnet"
      onRefresh={() => fetchShipments(true)}
      isRefreshing={isRefreshing}
    >
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card/50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Shipment Registry</p>
            <p className="text-xs text-muted-foreground">
              Trigger delivery events to initiate autonomous settlement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
          {lastUpdated && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTimestamp(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total"      value={counts.total}     icon={Package}      color="text-primary"      bg="bg-primary/10 border-primary/20" />
        <StatCard label="Pending"    value={counts.pending}   icon={CircleDot}    color="text-amber-400"    bg="bg-amber-500/10 border-amber-500/30" />
        <StatCard label="In Transit" value={counts.inTransit} icon={Truck}        color="text-blue-400"     bg="bg-blue-500/10 border-blue-500/30" />
        <StatCard label="Delivered"  value={counts.delivered} icon={Package}      color="text-violet-400"   bg="bg-violet-500/10 border-violet-500/30" />
        <StatCard label="Paid"       value={counts.paid}      icon={CheckCircle2} color="text-emerald-400"  bg="bg-emerald-500/10 border-emerald-500/30" />
      </div>

      <Separator className="mb-5" />

      {/* ── Shipment list ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            All Shipments
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {counts.total} total
            </span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchShipments(true)}
            disabled={isRefreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-xl border border-border bg-card/40 shimmer" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">No shipments found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add shipments to the simulator to get started
            </p>
          </div>
        ) : (
          shipments.map(shipment => (
            <ShipmentRow
              key={shipment.shipment_id}
              shipment={shipment}
              onTrigger={triggerEvent}
              triggering={triggeringId === shipment.shipment_id}
            />
          ))
        )}
      </div>

      {/* ── Info strip ───────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Settlement Rail</p>
          <p className="text-sm font-medium text-foreground">Arc (x402 Protocol)</p>
          <p className="text-xs text-muted-foreground">Sub-second finality</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Gas Abstraction</p>
          <p className="text-sm font-medium text-foreground">Circle Paymaster</p>
          <p className="text-xs text-muted-foreground">Fees paid in USDC</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">AI Validation</p>
          <p className="text-sm font-medium text-foreground">Gemini Pro</p>
          <p className="text-xs text-muted-foreground">Autonomous delivery check</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
