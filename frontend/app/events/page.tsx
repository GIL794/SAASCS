'use client';

import * as React from 'react';
import {
  Activity,
  RefreshCw,
  Cpu,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Radio,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatTimestamp } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
type LogType =
  | 'EVENT_RECEIVED'
  | 'AI_DECISION'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'FX_SWAP_EXECUTED'
  | 'ERROR';

interface LogEntry {
  type: LogType | string;
  timestamp: string;
  data: Record<string, any>;
}

// ── Log type config ───────────────────────────────────────────────────────────
const typeConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  EVENT_RECEIVED: {
    label: 'Event',
    icon: Radio,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  AI_DECISION: {
    label: 'AI',
    icon: Cpu,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment',
    icon: CreditCard,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  PAYMENT_CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  FX_SWAP_EXECUTED: {
    label: 'FX Swap',
    icon: Zap,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  ERROR: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
};

const defaultConfig = {
  label: 'Log',
  icon: Activity,
  color: 'text-muted-foreground',
  bg: 'bg-muted/20',
  border: 'border-border',
  dot: 'bg-muted-foreground',
};

function getConfig(type: string) {
  return typeConfig[type] ?? defaultConfig;
}

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
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', bg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Log entry row ─────────────────────────────────────────────────────────────
function LogRow({ entry, index }: { entry: LogEntry; index: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const cfg = getConfig(entry.type);
  const Icon = cfg.icon;

  const summary = React.useMemo(() => {
    const d = entry.data;
    if (entry.type === 'AI_DECISION') {
      return d.release_payment !== undefined
        ? `${d.release_payment ? '✓ Approved' : '✗ Rejected'} — ${d.reasoning?.slice(0, 60) ?? ''}…`
        : JSON.stringify(d).slice(0, 80);
    }
    if (entry.type === 'PAYMENT_CONFIRMED') {
      return d.transaction_hash ? `Tx: ${d.transaction_hash.slice(0, 16)}…` : 'Confirmed';
    }
    if (entry.type === 'ERROR') {
      return d.error ?? 'Unknown error';
    }
    const sid = d.shipment_id ?? d.eventId ?? '';
    const extra = Object.entries(d)
      .filter(([k]) => k !== 'shipment_id' && k !== 'eventId')
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ');
    return [sid, extra].filter(Boolean).join(' — ');
  }, [entry]);

  return (
    <div
      className={cn(
        'rounded-xl border bg-card/60 hover:bg-card transition-all duration-150 animate-fade-in overflow-hidden',
        cfg.border
      )}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start sm:items-center gap-3 p-3.5 text-left"
      >
        {/* Index */}
        <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/40 w-6 shrink-0 pt-0.5">
          {String(index + 1).padStart(3, '0')}
        </span>

        {/* Type icon */}
        <div className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
          cfg.bg, cfg.border
        )}>
          <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
        </div>

        {/* Type badge + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              cfg.bg, cfg.border, cfg.color
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
            {entry.data?.shipment_id && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {entry.data.shipment_id}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate pr-4">
            {summary}
          </p>
        </div>

        {/* Timestamp + expand */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTimestamp(entry.timestamp)}
          </span>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded JSON */}
      {expanded && (
        <div className="border-t border-border/50 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Raw Payload
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              {new Date(entry.timestamp).toLocaleString('en-GB')}
            </span>
          </div>
          <pre className="font-mono text-[11px] text-emerald-300/80 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(entry.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { key: 'ALL',               label: 'All' },
  { key: 'EVENT_RECEIVED',    label: 'Events' },
  { key: 'AI_DECISION',       label: 'AI' },
  { key: 'PAYMENT_SUBMITTED', label: 'Payments' },
  { key: 'PAYMENT_CONFIRMED', label: 'Confirmed' },
  { key: 'ERROR',             label: 'Errors' },
] as const;

type FilterKey = typeof FILTER_OPTIONS[number]['key'];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventLogPage() {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLive, setIsLive] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterKey>('ALL');
  const [search, setSearch] = React.useState('');
  const esRef = React.useRef<EventSource | null>(null);

  // ── Fetch all logs ──────────────────────────────────────────────────────────
  const fetchLogs = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/logs');
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

  // ── SSE — append new entries in real-time ───────────────────────────────────
  const connectSSE = React.useCallback(() => {
    esRef.current?.close();
    const es = new EventSource('/api/logs/stream');
    es.onopen = () => setIsLive(true);
    es.onerror = () => setIsLive(false);
    es.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        setEntries(prev => {
          // Deduplicate by type + timestamp
          const key = `${entry.type}_${entry.timestamp}`;
          const exists = prev.some(e => `${e.type}_${e.timestamp}` === key);
          if (exists) return prev;
          return [entry, ...prev]; // newest first
        });
      } catch {}
    };
    esRef.current = es;
  }, []);

  React.useEffect(() => {
    fetchLogs();
    connectSSE();
    return () => esRef.current?.close();
  }, [fetchLogs, connectSSE]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = React.useMemo(() => ({
    total:     entries.length,
    events:    entries.filter(e => e.type === 'EVENT_RECEIVED').length,
    ai:        entries.filter(e => e.type === 'AI_DECISION').length,
    payments:  entries.filter(e => e.type === 'PAYMENT_SUBMITTED' || e.type === 'PAYMENT_CONFIRMED').length,
    errors:    entries.filter(e => e.type === 'ERROR').length,
  }), [entries]);

  // ── Filtered + searched entries ─────────────────────────────────────────────
  const displayed = React.useMemo(() => {
    let result = entries;
    if (filter !== 'ALL') {
      result = result.filter(e => e.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.type.toLowerCase().includes(q) ||
        JSON.stringify(e.data).toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, filter, search]);

  return (
    <DashboardLayout
      title="Event Log"
      subtitle="Real-time agent activity stream"
      onRefresh={() => fetchLogs(true)}
      isRefreshing={isRefreshing}
    >
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card/50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Agent Activity Stream</p>
            <p className="text-xs text-muted-foreground">
              All IoT events, AI decisions, and payment actions logged in real-time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Entries"  value={stats.total}    icon={Activity}      color="text-primary"      bg="bg-primary/10 border-primary/20" />
        <StatCard label="IoT Events"     value={stats.events}   icon={Radio}         color="text-blue-400"     bg="bg-blue-500/10 border-blue-500/30" />
        <StatCard label="AI Decisions"   value={stats.ai}       icon={Cpu}           color="text-violet-400"   bg="bg-violet-500/10 border-violet-500/30" />
        <StatCard label="Payments"       value={stats.payments} icon={CreditCard}    color="text-amber-400"    bg="bg-amber-500/10 border-amber-500/30" />
        <StatCard label="Errors"         value={stats.errors}   icon={AlertCircle}   color="text-red-400"      bg="bg-red-500/10 border-red-500/30" />
      </div>

      <Separator className="mb-5" />

      {/* ── Controls: filter tabs + search + clear ────────────────────────── */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-1 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                filter === opt.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card/50 pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          {entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEntries([])}
              className="text-xs gap-1.5 text-muted-foreground hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Showing <span className="text-foreground font-medium">{displayed.length}</span> of{' '}
          <span className="text-foreground font-medium">{entries.length}</span> entries
        </span>
      </div>

      {/* ── Log entries ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 rounded-xl border border-border bg-card/40 shimmer" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {entries.length === 0 ? 'No log entries yet' : 'No entries match your filter'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {entries.length === 0
              ? 'Trigger a delivery event from the Shipments page to see agent activity here'
              : 'Try adjusting your filter or search query'}
          </p>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch('')}
              className="mt-3 text-xs"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((entry, i) => (
            <LogRow key={`${entry.type}_${entry.timestamp}_${i}`} entry={entry} index={i} />
          ))}
        </div>
      )}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-border bg-card/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Log Type Legend
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(typeConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={cn('flex h-6 w-6 items-center justify-center rounded border', cfg.bg, cfg.border)}>
                  <Icon className={cn('h-3 w-3', cfg.color)} />
                </div>
                <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
