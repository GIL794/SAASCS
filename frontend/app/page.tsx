'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { EventLog, type LogEntry } from '@/components/dashboard/EventLog';
import { ShipmentTable } from '@/components/dashboard/ShipmentTable';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap } from 'lucide-react';

interface Shipment {
  shipment_id: string;
  buyer_id: string;
  supplier_id: string;
  delivery_location: string;
  status?: 'pending' | 'in-transit' | 'delivered' | 'paid';
}

export default function DashboardPage() {
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [logEntries, setLogEntries] = React.useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLive, setIsLive] = React.useState(false);
  const esRef = React.useRef<EventSource | null>(null);

  // ── Fetch shipments ─────────────────────────────────────────────────────────
  const fetchShipments = React.useCallback(async () => {
    try {
      const res = await fetch('/api/shipments');
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      }
    } catch {
      // Backend not running yet — use demo data
      setShipments([
        { shipment_id: 'SHIP123', buyer_id: 'BUYER001', supplier_id: 'SUPPLIER001', delivery_location: 'London, UK', status: 'delivered' },
        { shipment_id: 'SHIP456', buyer_id: 'BUYER002', supplier_id: 'SUPPLIER002', delivery_location: 'Madrid, Spain', status: 'in-transit' },
      ]);
    }
  }, []);

  // ── Fetch existing logs ─────────────────────────────────────────────────────
  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data: LogEntry[] = await res.json();
        setLogEntries(data);
      }
    } catch {
      // Backend not running — no logs yet
    }
  }, []);

  // ── SSE live log stream ─────────────────────────────────────────────────────
  const connectSSE = React.useCallback(() => {
    esRef.current?.close();
    const es = new EventSource('/api/logs/stream');

    es.onopen = () => setIsLive(true);

    es.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        setLogEntries((prev) => {
          const key = `${entry.type}_${entry.timestamp}`;
          if (prev.some((e) => `${e.type}_${e.timestamp}` === key)) return prev;
          return [...prev, entry];
        });
      } catch {
        // ignore heartbeat / parse errors
      }
    };

    es.onerror = () => {
      setIsLive(false);
      es.close();
    };

    esRef.current = es;
  }, []);

  // ── Trigger delivery event ──────────────────────────────────────────────────
  const triggerEvent = React.useCallback(async (shipmentId: string) => {
    const shipment = shipments.find((s) => s.shipment_id === shipmentId);
    if (!shipment) return;

    const event = {
      event_type: 'CargoDelivered',
      timestamp: new Date().toISOString(),
      shipment_id: shipment.shipment_id,
      buyer_id: shipment.buyer_id,
      supplier_id: shipment.supplier_id,
      delivery_location: shipment.delivery_location,
      proof_type: 'GPS',
      proof_payload: JSON.stringify({ lat: 51.5074, lng: -0.1278 }),
    };

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      // Update shipment status optimistically
      setShipments((prev) =>
        prev.map((s) =>
          s.shipment_id === shipmentId ? { ...s, status: 'delivered' } : s
        )
      );
    } catch {
      // Backend not running
    }
  }, [shipments]);

  // ── Refresh handler ─────────────────────────────────────────────────────────
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchShipments(), fetchLogs()]);
    setTimeout(() => setIsRefreshing(false), 600);
  }, [fetchShipments, fetchLogs]);

  // ── Init ────────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    fetchShipments();
    fetchLogs();
    connectSSE();
    return () => {
      esRef.current?.close();
    };
  }, [mounted, fetchShipments, fetchLogs, connectSSE]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const aiDecisions = logEntries.filter((e) => e.type === 'AI_DECISION');
  const paymentsConfirmed = logEntries.filter((e) => e.type === 'PAYMENT_CONFIRMED').length;
  const totalVolume = aiDecisions
    .filter((e) => e.data.release_payment && e.data.approved_amount)
    .reduce((sum, e) => sum + (Number(e.data.approved_amount) || 0), 0)
    .toFixed(2);

  return (
    <DashboardLayout
      title="Supply Chain Dashboard"
      subtitle="ZeroLag · Arc × Encode Hackathon"
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Autonomous Settlement Active
          </p>
          <p className="text-xs text-muted-foreground">
            Delivery events → Gemini AI → Circle Wallets → Arc finality. No paperwork lag.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-[10px]">
            Arc Testnet
          </Badge>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────── */}
      <StatsCards
        totalShipments={shipments.length}
        paymentsSettled={paymentsConfirmed}
        totalVolume={totalVolume}
        aiDecisions={aiDecisions.length}
      />

      <Separator className="my-5" />

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Shipment table */}
        <ShipmentTable
          shipments={shipments}
          onTriggerEvent={triggerEvent}
        />

        {/* Event log */}
        <EventLog
          entries={logEntries}
          isLive={isLive}
          onClear={() => setLogEntries([])}
          maxHeight="360px"
        />
      </div>

      {/* ── Bottom info strip ────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Payment Rail
          </p>
          <p className="text-sm font-medium text-foreground">Circle Programmable Wallets</p>
          <p className="text-xs text-muted-foreground">Gas abstracted via Paymaster (USDC)</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Settlement Network
          </p>
          <p className="text-sm font-medium text-foreground">Arc (x402 Protocol)</p>
          <p className="text-xs text-muted-foreground">Sub-second finality on Arc</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            AI Decision Engine
          </p>
          <p className="text-sm font-medium text-foreground">Gemini Pro</p>
          <p className="text-xs text-muted-foreground">Autonomous delivery validation</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
