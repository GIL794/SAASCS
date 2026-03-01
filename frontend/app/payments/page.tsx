'use client';

import * as React from 'react';
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Wallet,
  Banknote,
  TrendingUp,
  Hash,
  ExternalLink,
  Loader2,
  CircleDot,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatCurrency, formatTimestamp, formatDate, truncateHash } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LogEntry {
  type: 'PAYMENT_SUBMITTED' | 'PAYMENT_CONFIRMED' | string;
  timestamp: string;
  data: {
    shipment_id?: string;
    asset?: string;
    amount?: number;
    source?: string;
    destination?: string;
    transaction_hash?: string;
    confirmation?: any;
    error?: string;
  };
}

interface PaymentRecord {
  id: string;
  shipment_id: string;
  amount: number;
  currency: string;
  source: string;
  destination: string;
  status: 'submitted' | 'confirmed' | 'failed';
  submitted_at: string;
  confirmed_at?: string;
  tx_hash?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildPaymentRecords(entries: LogEntry[]): PaymentRecord[] {
  const map = new Map<string, PaymentRecord>();

  for (const entry of entries) {
    const sid = entry.data?.shipment_id ?? 'UNKNOWN';
    const key = sid;

    if (entry.type === 'PAYMENT_SUBMITTED') {
      map.set(key, {
        id: key,
        shipment_id: sid,
        amount: entry.data.amount ?? 0,
        currency: entry.data.asset ?? 'USDC',
        source: entry.data.source ?? 'WALLET_BUYER001',
        destination: entry.data.destination ?? 'WALLET_SUPPLIER001',
        status: 'submitted',
        submitted_at: entry.timestamp,
      });
    }

    if (entry.type === 'PAYMENT_CONFIRMED') {
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          status: 'confirmed',
          confirmed_at: entry.timestamp,
          tx_hash: entry.data.transaction_hash,
        });
      } else {
        map.set(key, {
          id: key,
          shipment_id: sid,
          amount: entry.data.amount ?? 0,
          currency: entry.data.asset ?? 'USDC',
          source: entry.data.source ?? 'WALLET_BUYER001',
          destination: entry.data.destination ?? 'WALLET_SUPPLIER001',
          status: 'confirmed',
          submitted_at: entry.timestamp,
          confirmed_at: entry.timestamp,
          tx_hash: entry.data.transaction_hash,
        });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', bg)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Payment row ───────────────────────────────────────────────────────────────
function PaymentRow({ payment }: { payment: PaymentRecord }) {
  const isConfirmed = payment.status === 'confirmed';
  const isSubmitted = payment.status === 'submitted';

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card/60 hover:bg-card p-4 transition-all duration-150 animate-fade-in">
      {/* Status icon */}
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
        isConfirmed
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isSubmitted
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-red-500/10 border-red-500/30'
      )}>
        {isConfirmed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : isSubmitted ? (
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-400" />
        )}
      </div>

      {/* Shipment + amount */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-foreground">
            {payment.shipment_id}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            isConfirmed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : isSubmitted
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}>
            <span className={cn(
              'h-1.5 w-1.5 rounded-full',
              isConfirmed ? 'bg-emerald-400' : isSubmitted ? 'bg-blue-400 animate-pulse' : 'bg-red-400'
            )} />
            {isConfirmed ? 'Confirmed' : isSubmitted ? 'Submitted' : 'Failed'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            {payment.source}
          </span>
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            {payment.destination}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="sm:text-right sm:w-32">
        <p className="text-sm font-bold text-foreground">
          {payment.amount > 0 ? formatCurrency(payment.amount, payment.currency) : '—'}
        </p>
        <p className="text-[10px] text-muted-foreground">{payment.currency}</p>
      </div>

      {/* Tx hash */}
      <div className="sm:w-36">
        {payment.tx_hash ? (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-[11px] text-primary truncate">
              {truncateHash(payment.tx_hash, 6)}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No hash yet</span>
        )}
      </div>

      {/* Timestamps */}
      <div className="sm:w-28 text-right">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
          <Clock className="h-3 w-3" />
          {formatTimestamp(payment.submitted_at)}
        </p>
        {payment.confirmed_at && (
          <p className="text-[10px] text-emerald-400 mt-0.5">
            ✓ {formatTimestamp(payment.confirmed_at)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Confirmed', 'Submitted', 'Failed'] as const;
type Filter = typeof FILTERS[number];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLive, setIsLive] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>('All');
  const esRef = React.useRef<EventSource | null>(null);

  // ── Fetch payment logs ──────────────────────────────────────────────────────
  const fetchPayments = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data: LogEntry[] = await res.json();
        setEntries(data);
      }
    } catch {}
    finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ── SSE — append new payment events ────────────────────────────────────────
  const connectSSE = React.useCallback(() => {
    esRef.current?.close();
    const es = new EventSource('/api/logs/stream');
    es.onopen = () => setIsLive(true);
    es.onerror = () => setIsLive(false);
    es.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        if (entry.type === 'PAYMENT_SUBMITTED' || entry.type === 'PAYMENT_CONFIRMED') {
          setEntries(prev => {
            const exists = prev.some(
              e => e.type === entry.type && e.data?.shipment_id === entry.data?.shipment_id
            );
            return exists ? prev : [...prev, entry];
          });
        }
      } catch {}
    };
    esRef.current = es;
  }, []);

  React.useEffect(() => {
    fetchPayments();
    connectSSE();
    return () => esRef.current?.close();
  }, [fetchPayments, connectSSE]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const records = React.useMemo(() => buildPaymentRecords(entries), [entries]);

  const filtered = React.useMemo(() => {
    if (filter === 'All') return records;
    if (filter === 'Confirmed') return records.filter(r => r.status === 'confirmed');
    if (filter === 'Submitted') return records.filter(r => r.status === 'submitted');
    if (filter === 'Failed') return records.filter(r => r.status === 'failed');
    return records;
  }, [records, filter]);

  const totalVolume = React.useMemo(
    () => records.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.amount, 0),
    [records]
  );

  const stats = {
    total: records.length,
    confirmed: records.filter(r => r.status === 'confirmed').length,
    submitted: records.filter(r => r.status === 'submitted').length,
    failed: records.filter(r => r.status === 'failed').length,
  };

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Settlement history via Circle Wallets & Arc"
      onRefresh={() => fetchPayments(true)}
      isRefreshing={isRefreshing}
    >
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card/50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Payment Settlement</p>
            <p className="text-xs text-muted-foreground">
              Autonomous x402 payments via Circle Programmable Wallets
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
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Volume"
          value={formatCurrency(totalVolume)}
          sub="Confirmed settlements"
          icon={Banknote}
          color="text-emerald-400"
          bg="bg-emerald-500/10 border-emerald-500/30"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          sub="Fully settled"
          icon={CheckCircle2}
          color="text-emerald-400"
          bg="bg-emerald-500/10 border-emerald-500/30"
        />
        <StatCard
          label="Submitted"
          value={stats.submitted}
          sub="Awaiting confirmation"
          icon={CircleDot}
          color="text-blue-400"
          bg="bg-blue-500/10 border-blue-500/30"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          sub="Requires attention"
          icon={AlertCircle}
          color="text-red-400"
          bg="bg-red-500/10 border-red-500/30"
        />
      </div>

      <Separator className="mb-5" />

      {/* ── Filter tabs + refresh ─────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {f}
              {f !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f === 'Confirmed' ? stats.confirmed
                    : f === 'Submitted' ? stats.submitted
                    : stats.failed}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchPayments(true)}
          disabled={isRefreshing}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* ── Payment list ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card/40 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">No payments yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Trigger a delivery event from the Shipments page to initiate autonomous settlement
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(payment => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </div>
      )}

      {/* ── Info strip ───────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Protocol</p>
          <p className="text-sm font-medium text-foreground">x402 / HTTP 402</p>
          <p className="text-xs text-muted-foreground">Machine-to-machine payments</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Wallet Provider</p>
          <p className="text-sm font-medium text-foreground">Circle Dev Wallets</p>
          <p className="text-xs text-muted-foreground">Programmable custody</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">FX Layer</p>
          <p className="text-sm font-medium text-foreground">StableFX</p>
          <p className="text-xs text-muted-foreground">USDC → EURC PvP settlement</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
