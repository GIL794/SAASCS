'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import {
  Sun,
  Moon,
  Sparkles,
  Bell,
  RefreshCw,
  Radio,
  Cpu,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from './MobileNav';
import { cn, formatTimestamp } from '@/lib/utils';

// ── Notification types ────────────────────────────────────────────────────────
interface NotifEntry {
  type: string;
  timestamp: string;
  data: Record<string, any>;
  id: string;
}

const notifConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  EVENT_RECEIVED:    { icon: Radio,         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    label: 'IoT Event' },
  AI_DECISION:       { icon: Cpu,           color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  label: 'AI Decision' },
  PAYMENT_SUBMITTED: { icon: CreditCard,    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Payment' },
  PAYMENT_CONFIRMED: { icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Confirmed' },
  FX_SWAP_EXECUTED:  { icon: Zap,           color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    label: 'FX Swap' },
  ERROR:             { icon: AlertCircle,   color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Error' },
};

const defaultNotifConfig = {
  icon: Bell,
  color: 'text-muted-foreground',
  bg: 'bg-muted/20',
  border: 'border-border',
  label: 'Event',
};

function getNotifConfig(type: string) {
  return notifConfig[type] ?? defaultNotifConfig;
}

function getNotifSummary(entry: NotifEntry): string {
  const d = entry.data;
  switch (entry.type) {
    case 'EVENT_RECEIVED':
      return `Shipment ${d.shipment_id ?? '—'} · ${d.event_type ?? d.location ?? ''}`;
    case 'AI_DECISION':
      return d.release_payment
        ? `✓ Approved $${d.approved_amount ?? 0} ${d.currency ?? 'USDC'}`
        : `✗ Rejected — ${(d.reasoning ?? '').slice(0, 50)}`;
    case 'PAYMENT_SUBMITTED':
      return `$${d.amount ?? 0} ${d.asset ?? 'USDC'} → ${d.destinationWalletId ?? 'supplier'}`;
    case 'PAYMENT_CONFIRMED':
      return `Tx confirmed: ${(d.transaction_hash ?? '').slice(0, 14)}…`;
    case 'FX_SWAP_EXECUTED':
      return `FX swap executed · ${d.paymentId ?? ''}`;
    case 'ERROR':
      return (d.error ?? 'Unknown error').slice(0, 70);
    default:
      return JSON.stringify(d).slice(0, 60);
  }
}

// ── Notification Tray ─────────────────────────────────────────────────────────
function NotificationTray({ onGeminiOpen }: { onGeminiOpen?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotifEntry[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [isLive, setIsLive] = React.useState(false);
  const trayRef = React.useRef<HTMLDivElement>(null);
  const esRef = React.useRef<EventSource | null>(null);

  // Pre-fetch existing logs on mount
  React.useEffect(() => {
    fetch('/api/logs')
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ type: string; timestamp: string; data: Record<string, any> }>) => {
        const entries: NotifEntry[] = data.slice(-20).reverse().map((e, i) => ({
          ...e,
          id: `${e.type}_${e.timestamp}_${i}`,
        }));
        setNotifications(entries);
      })
      .catch(() => {});
  }, []);

  // SSE subscription
  React.useEffect(() => {
    esRef.current?.close();
    const es = new EventSource('/api/logs/stream');
    es.onopen = () => setIsLive(true);
    es.onerror = () => setIsLive(false);
    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as { type: string; timestamp: string; data: Record<string, any> };
        const entry: NotifEntry = {
          ...raw,
          id: `${raw.type}_${raw.timestamp}_${Math.random()}`,
        };
        setNotifications(prev => {
          const exists = prev.some(n => n.type === entry.type && n.timestamp === entry.timestamp);
          if (exists) return prev;
          return [entry, ...prev].slice(0, 50);
        });
        setUnread(c => c + 1);
      } catch {}
    };
    esRef.current = es;
    return () => es.close();
  }, []);

  // Click outside to close
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = () => {
    setOpen(o => !o);
    if (!open) setUnread(0);
  };

  const clearAll = () => setNotifications([]);

  return (
    <div ref={trayRef} className="relative">
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleToggle}
        className={cn(
          'relative text-muted-foreground hover:text-foreground',
          open && 'bg-muted text-foreground'
        )}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {isLive && unread === 0 && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </Button>

      {/* Dropdown tray */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {notifications.length > 0 && (
                <span className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isLive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Agent events will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notif) => {
                  const cfg = getNotifConfig(notif.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border mt-0.5',
                        cfg.bg, cfg.border
                      )}>
                        <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn('text-[10px] font-semibold uppercase tracking-wide', cfg.color)}>
                            {cfg.label}
                          </span>
                          {notif.data?.shipment_id && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              · {notif.data.shipment_id}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground leading-snug line-clamp-2">
                          {getNotifSummary(notif)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTimestamp(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-muted/20">
            <span className="text-[10px] text-muted-foreground">
              Powered by SSE · real-time agent stream
            </span>
            <button
              onClick={() => { setOpen(false); onGeminiOpen?.(); }}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Open Gemini AI
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
interface HeaderProps {
  title?: string;
  subtitle?: string;
  onGeminiOpen?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  title = 'Dashboard',
  subtitle,
  onGeminiOpen,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile burger menu */}
      <MobileNav onGeminiOpen={onGeminiOpen} />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Refresh */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        )}

        {/* Notification tray */}
        <NotificationTray onGeminiOpen={onGeminiOpen} />

        {/* Gemini AI button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onGeminiOpen}
          className="hidden sm:flex items-center gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Gemini AI
        </Button>

        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
