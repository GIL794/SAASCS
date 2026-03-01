'use client';

import * as React from 'react';
import { Activity, Circle, AlertCircle, CheckCircle2, CreditCard, Sparkles, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatTimestamp } from '@/lib/utils';

export interface LogEntry {
  type: 'EVENT_RECEIVED' | 'AI_DECISION' | 'PAYMENT_SUBMITTED' | 'PAYMENT_CONFIRMED' | 'FX_SWAP_EXECUTED' | 'ERROR';
  timestamp: string;
  data: Record<string, any>;
}

const logConfig: Record<LogEntry['type'], {
  label: string;
  icon: React.ElementType;
  badgeVariant: 'event' | 'decision' | 'payment' | 'confirmed' | 'fx' | 'error';
  iconClass: string;
  rowClass: string;
}> = {
  EVENT_RECEIVED:    { label: 'Event',     icon: Circle,         badgeVariant: 'event',     iconClass: 'text-blue-400',    rowClass: 'border-l-blue-500/40' },
  AI_DECISION:       { label: 'AI',        icon: Sparkles,       badgeVariant: 'decision',  iconClass: 'text-violet-400',  rowClass: 'border-l-violet-500/40' },
  PAYMENT_SUBMITTED: { label: 'Payment',   icon: CreditCard,     badgeVariant: 'payment',   iconClass: 'text-emerald-400', rowClass: 'border-l-emerald-500/40' },
  PAYMENT_CONFIRMED: { label: 'Confirmed', icon: CheckCircle2,   badgeVariant: 'confirmed', iconClass: 'text-cyan-400',    rowClass: 'border-l-cyan-500/40' },
  FX_SWAP_EXECUTED:  { label: 'FX Swap',   icon: ArrowRightLeft, badgeVariant: 'fx',        iconClass: 'text-amber-400',   rowClass: 'border-l-amber-500/40' },
  ERROR:             { label: 'Error',     icon: AlertCircle,    badgeVariant: 'error',     iconClass: 'text-red-400',     rowClass: 'border-l-red-500/40' },
};

function renderDataSummary(entry: LogEntry): string {
  const d = entry.data;
  switch (entry.type) {
    case 'EVENT_RECEIVED':
      return `Shipment ${d.shipment_id} — ${d.event_type ?? 'CargoDelivered'} @ ${d.location ?? ''}`;
    case 'AI_DECISION':
      return `${d.shipment_id}: ${d.release_payment ? '✓ Approved' : '✗ Rejected'} — ${d.approved_amount} ${d.currency} — "${d.reasoning?.slice(0, 60)}…"`;
    case 'PAYMENT_SUBMITTED':
      return `${d.shipment_id}: ${d.amount} ${d.asset} from ${d.source} → ${d.destination}`;
    case 'PAYMENT_CONFIRMED':
      return `${d.shipment_id}: TX ${d.transaction_hash?.slice(0, 12) ?? ''}…`;
    case 'FX_SWAP_EXECUTED':
      return `Payment ${d.paymentId}: FX swap executed`;
    case 'ERROR':
      return `${d.shipment_id ?? 'Unknown'}: ${d.error}`;
    default:
      return JSON.stringify(d).slice(0, 80);
  }
}

interface EventLogProps {
  entries?: LogEntry[];
  isLive?: boolean;
  onClear?: () => void;
  maxHeight?: string;
}

export function EventLog({
  entries = [],
  isLive = false,
  onClear,
  maxHeight = '320px',
}: EventLogProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Event Log</CardTitle>
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {entries.length} entries
            </Badge>
            {onClear && entries.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClear}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                aria-label="Clear log"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No events yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Trigger a delivery event to see logs here
            </p>
          </div>
        ) : (
          <ScrollArea style={{ height: maxHeight }}>
            <div className="divide-y divide-border/50">
              {entries.map((entry, idx) => {
                const config = logConfig[entry.type];
                const Icon = config.icon;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-3 px-4 py-2.5 border-l-2 animate-fade-in',
                      'hover:bg-muted/20 transition-colors',
                      config.rowClass
                    )}
                  >
                    {/* Icon */}
                    <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', config.iconClass)} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0 h-4">
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed break-words">
                        {renderDataSummary(entry)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
