'use client';

import * as React from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Activity,
  ArrowRightLeft,
  Circle,
  Wifi,
  WifiOff,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn, formatTimestamp, formatCurrency } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LogEntry {
  type:
    | 'EVENT_RECEIVED'
    | 'AI_DECISION'
    | 'PAYMENT_SUBMITTED'
    | 'PAYMENT_CONFIRMED'
    | 'FX_SWAP_EXECUTED'
    | 'ERROR';
  timestamp: string;
  data: Record<string, any>;
}

// ── Log type config ───────────────────────────────────────────────────────────
const typeConfig: Record<
  LogEntry['type'],
  {
    label: string;
    icon: React.ElementType;
    badgeVariant: 'event' | 'decision' | 'payment' | 'confirmed' | 'fx' | 'error';
    iconClass: string;
    borderClass: string;
  }
> = {
  EVENT_RECEIVED:    { label: 'Event Received',    icon: Circle,         badgeVariant: 'event',     iconClass: 'text-blue-400',    borderClass: 'border-blue-500/30' },
  AI_DECISION:       { label: 'AI Decision',       icon: Sparkles,       badgeVariant: 'decision',  iconClass: 'text-violet-400',  borderClass: 'border-violet-500/30' },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', icon: CreditCard,     badgeVariant: 'payment',   iconClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' },
  PAYMENT_CONFIRMED: { label: 'Payment Confirmed', icon: CheckCircle2,   badgeVariant: 'confirmed', iconClass: 'text-cyan-400',    borderClass: 'border-cyan-500/30' },
  FX_SWAP_EXECUTED:  { label: 'FX Swap',           icon: ArrowRightLeft, badgeVariant: 'fx',        iconClass: 'text-amber-400',   borderClass: 'border-amber-500/30' },
  ERROR:             { label: 'Error',             icon: AlertTriangle,  badgeVariant: 'error',     iconClass: 'text-red-400',     borderClass: 'border-red-500/30' },
};

// ── AI Decision card ──────────────────────────────────────────────────────────
function AIDecisionCard({ data }: { data: Record<string, any> }) {
  const [expanded, setExpanded] = React.useState(false);
  const approved = data.release_payment === true;

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-2',
      approved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
    )}>
      {/* Decision header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {approved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <span className={cn('text-sm font-semibold', approved ? 'text-emerald-400' : 'text-red-400')}>
            {approved ? 'Payment Approved' : 'Payment Rejected'}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Amount */}
      {approved && data.approved_amount && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Amount:</span>
          <span className="text-sm font-bold text-foreground">
            {formatCurrency(data.approved_amount, data.currency)}
          </span>
        </div>
      )}

      {/* Shipment ref */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Shipment:</span>
        <span className="mono text-xs text-foreground">{data.shipment_id}</span>
      </div>

      {/* Reasoning (expandable) */}
      {expanded && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          {data.reasoning && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Reasoning
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {data.reasoning}
              </p>
            </div>
          )}
          {data.issues_detected && data.issues_detected.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Issues Detected
              </p>
              <ul className="space-y-0.5">
                {data.issues_detected.map((issue: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single log entry row ──────────────────────────────────────────────────────
function LogEntryRow({ entry }: { entry: LogEntry }) {
  const config = typeConfig[entry.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-1.5 animate-fade-in',
      config.borderClass,
      'bg-card/50'
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-3.5 w-3.5 shrink-0', config.iconClass)} />
          <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0 h-4">
            {config.label}
          </Badge>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
          {formatTimestamp(entry.timestamp)}
        </span>
      </div>

      {/* AI Decision gets special treatment */}
      {entry.type === 'AI_DECISION' ? (
        <AIDecisionCard data={entry.data} />
      ) : (
        <div className="text-xs text-foreground/70 space-y-0.5">
          {Object.entries(entry.data)
            .filter(([k]) => !['raw'].includes(k))
            .slice(0, 4)
            .map(([key, val]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-muted-foreground shrink-0 min-w-[80px]">{key}:</span>
                <span className="mono break-all">
                  {typeof val === 'object' ? JSON.stringify(val).slice(0, 60) : String(val ?? '—')}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main GeminiDrawer ─────────────────────────────────────────────────────────
interface GeminiDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeminiDrawer({ open, onOpenChange }: GeminiDrawerProps) {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [connected, setConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<LogEntry['type'] | 'ALL'>('ALL');
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const esRef = React.useRef<EventSource | null>(null);

  // ── Fetch existing logs + connect SSE when drawer opens ────────────────────
  React.useEffect(() => {
    if (!open) return;

    // 1. Pre-fetch all existing log entries immediately via HTTP GET
    fetch('/api/logs')
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        if (Array.isArray(data)) {
          setEntries(data);
        }
      })
      .catch(() => {});

    // 2. Close any existing SSE connection
    esRef.current?.close();

    // 3. Open SSE for real-time new entries
    const es = new EventSource('/api/logs/stream');
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        setEntries((prev) => {
          // Deduplicate by timestamp + type
          const key = `${entry.type}_${entry.timestamp}`;
          const exists = prev.some((e) => `${e.type}_${e.timestamp}` === key);
          if (exists) return prev;
          return [...prev, entry];
        });
      } catch {
        // Ignore parse errors (heartbeat comments are filtered by browser)
      }
    };

    es.onerror = () => {
      setConnected(false);
      setError('Connection lost — retrying…');
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [open]);

  // ── Auto-scroll to bottom ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries.length, open]);

  // ── Filtered entries ────────────────────────────────────────────────────────
  const filtered = filter === 'ALL' ? entries : entries.filter((e) => e.type === filter);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const aiDecisions = entries.filter((e) => e.type === 'AI_DECISION');
  const approved = aiDecisions.filter((e) => e.data.release_payment === true).length;
  const totalVolume = aiDecisions
    .filter((e) => e.data.release_payment && e.data.approved_amount)
    .reduce((sum, e) => sum + (Number(e.data.approved_amount) || 0), 0);

  const filterOptions: Array<{ value: LogEntry['type'] | 'ALL'; label: string }> = [
    { value: 'ALL',               label: 'All' },
    { value: 'EVENT_RECEIVED',    label: 'Events' },
    { value: 'AI_DECISION',       label: 'AI' },
    { value: 'PAYMENT_SUBMITTED', label: 'Payments' },
    { value: 'PAYMENT_CONFIRMED', label: 'Confirmed' },
    { value: 'ERROR',             label: 'Errors' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] p-0 flex flex-col bg-[hsl(var(--sidebar-bg))]"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-5 py-4 border-b border-[hsl(var(--sidebar-border))] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/30">
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold leading-none text-violet-600">
                  Gemini Intelligence
                </SheetTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {connected ? (
                    <>
                      <Wifi className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Live stream</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {error ?? 'Connecting…'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[hsl(var(--sidebar-fg))] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-[hsl(var(--sidebar-border))] border-b border-[hsl(var(--sidebar-border))] shrink-0">
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-bold text-[hsl(var(--sidebar-fg))]">{entries.length}</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">Total Events</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{approved}</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">Approved</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-bold text-cyan-400">
              ${totalVolume.toFixed(2)}
            </p>
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">USDC Volume</p>
          </div>
        </div>

        {/* ── Filter tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[hsl(var(--sidebar-border))] overflow-x-auto shrink-0">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                filter === opt.value
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-[hsl(var(--sidebar-muted))] hover:text-white hover:bg-white/10'
              )}
            >
              {opt.label}
              {opt.value !== 'ALL' && (
                <span className="ml-1 opacity-60">
                  {entries.filter((e) => e.type === opt.value).length}
                </span>
              )}
            </button>
          ))}

          {entries.length > 0 && (
            <button
              onClick={() => setEntries([])}
              className="ml-auto shrink-0 p-1 rounded text-[hsl(var(--sidebar-muted))] hover:text-red-400 transition-colors"
              aria-label="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Log entries ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
                <Activity className="h-5 w-5 text-violet-400" />
              </div>
              <p className="text-sm font-medium text-white">
                {entries.length === 0 ? 'Waiting for events…' : 'No matching events'}
              </p>
              <p className="text-xs text-[hsl(var(--sidebar-muted))] mt-1 max-w-[240px]">
                {entries.length === 0
                  ? 'Start the IoT simulator and trigger a delivery event to see Gemini AI decisions here in real-time.'
                  : 'Try a different filter to see more events.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {filtered.map((entry, idx) => (
                  <LogEntryRow key={`${entry.type}_${entry.timestamp}_${idx}`} entry={entry} />
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-[hsl(var(--sidebar-border))] shrink-0">
          <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">
            Streaming from{' '}
            <span className="font-mono text-primary">localhost:8000/logs/stream</span>
            {' '}· Gemini Pro · Arc Testnet
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
