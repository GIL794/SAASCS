'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Settings, Sun, Moon, Monitor, Wallet, Key, Bell, Shield, Activity, Copy, Check, Eye, EyeOff, Zap, CreditCard, RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Unplug, Plug, Save, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function useLS<T>(key: string, init: T): [T, (v: T) => void] {
  const [val, setVal] = React.useState<T>(() => {
    if (typeof window === 'undefined') return init;
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = (v: T) => { setVal(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [val, set];
}

function useCopy() {
  const [copied, setCopied] = React.useState(false);
  const copy = (t: string) => { navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return { copied, copy };
}

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} role="switch" aria-checked={on}
      className={cn('relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors', on ? 'bg-primary' : 'bg-muted-foreground/30')}>
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', on ? 'translate-x-4' : 'translate-x-0')} />
    </button>
  );
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = React.useState(false);
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Enter key…'}
          className="w-56 rounded-lg border border-border bg-background px-3 py-2 pr-8 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {value && (
        <button type="button" onClick={() => copy(value)} className="text-muted-foreground hover:text-foreground">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
      ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
      {ok ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

function Section({ icon: Icon, title, desc, accent = 'text-primary', bg = 'bg-primary/10 border-primary/20', children }: {
  icon: React.ElementType; title: string; desc: string; accent?: string; bg?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', bg)}>
          <Icon className={cn('h-4 w-4', accent)} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const WALLETS = [
  { id: 'metamask', label: 'MetaMask', emoji: '🦊', desc: 'Browser extension wallet' },
  { id: 'walletconnect', label: 'WalletConnect', emoji: '🔗', desc: 'Scan QR with mobile wallet' },
  { id: 'coinbase', label: 'Coinbase Wallet', emoji: '🔵', desc: 'Coinbase self-custody wallet' },
  { id: 'circle', label: 'Circle Dev Wallet', emoji: '⭕', desc: 'Circle programmable wallet' },
];
const NETWORKS = [
  { id: 'arc-testnet', label: 'Arc Testnet (0x1A4)' },
  { id: 'arc-mainnet', label: 'Arc Mainnet (0x1A5)' },
  { id: 'ethereum', label: 'Ethereum (0x1)' },
  { id: 'polygon', label: 'Polygon (0x89)' },
];

function WalletSection() {
  const [connected, setConnected] = useLS<string | null>('wallet_connected', null);
  const [address, setAddress] = useLS<string>('wallet_address', '');
  const [network, setNetwork] = useLS<string>('wallet_network', 'arc-testnet');
  const [connecting, setConnecting] = React.useState<string | null>(null);
  const { copied, copy } = useCopy();
  const connect = (id: string) => {
    setConnecting(id);
    setTimeout(() => {
      const addr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setConnected(id); setAddress(addr); setConnecting(null);
    }, 1200);
  };
  return (
    <div className="space-y-4">
      {connected ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{WALLETS.find(w => w.id === connected)?.emoji ?? '💼'}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{WALLETS.find(w => w.id === connected)?.label}</p>
                <Badge ok label="Connected" />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setConnected(null); setAddress(''); }} className="text-xs text-muted-foreground hover:text-red-400 gap-1.5">
              <Unplug className="h-3.5 w-3.5" /> Disconnect
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-background border border-border px-3 py-2">
            <span className="font-mono text-xs text-foreground flex-1 truncate">{address}</span>
            <button onClick={() => copy(address)} className="text-muted-foreground hover:text-foreground shrink-0">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <Row label="Network" desc="Select the blockchain network">
            <select value={network} onChange={e => setNetwork(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
              {NETWORKS.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </Row>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-3">Connect a Web3 wallet to sign payment transactions and interact with Arc smart contracts.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WALLETS.map(w => (
              <button key={w.id} onClick={() => connect(w.id)} disabled={connecting !== null}
                className={cn('flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5', connecting === w.id && 'opacity-70 cursor-wait')}>
                <span className="text-xl">{w.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{w.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{w.desc}</p>
                </div>
                {connecting === w.id ? <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" /> : <Plug className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
      <Separator />
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Circle Programmable Wallets</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Buyer Wallet', id: 'WALLET_BUYER001', balance: '50,000 USDC' },
            { label: 'Supplier Wallet', id: 'WALLET_SUPPLIER001', balance: '0 USDC' },
          ].map(w => (
            <div key={w.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-foreground">{w.label}</p>
                <Badge ok label="Active" />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">{w.id}</p>
              <p className="text-xs font-medium text-foreground mt-1">{w.balance}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [backendOk, setBackendOk] = React.useState<boolean | null>(null);

  const [geminiKey, setGeminiKey] = useLS('s_gemini', '');
  const [circleKey, setCircleKey] = useLS('s_circle', '');
  const [arcRpc, setArcRpc] = useLS('s_arc_rpc', 'https://rpc.arc-testnet.example.com');
  const [stablefxKey, setStablefxKey] = useLS('s_stablefx', '');
  const [backendKey, setBackendKey] = useLS('s_backend_key', '');
  const [currency, setCurrency] = useLS('s_currency', 'USDC');
  const [minPay, setMinPay] = useLS('s_min_pay', '0.01');
  const [maxPay, setMaxPay] = useLS('s_max_pay', '10000000');
  const [buyerWallet, setBuyerWallet] = useLS('s_buyer_wallet', 'WALLET_BUYER001');
  const [suppWallet, setSuppWallet] = useLS('s_supp_wallet', 'WALLET_SUPPLIER001');
  const [fxEnabled, setFxEnabled] = useLS('s_fx', false);
  const [autoApprove, setAutoApprove] = useLS('s_auto_approve', true);
  const [nEvents, setNEvents] = useLS('s_n_events', true);
  const [nAI, setNAI] = useLS('s_n_ai', true);
  const [nPayments, setNPayments] = useLS('s_n_payments', true);
  const [nErrors, setNErrors] = useLS('s_n_errors', true);
  const [nSound, setNSound] = useLS('s_n_sound', false);
  const [corsOrigin, setCorsOrigin] = useLS('s_cors', 'http://localhost:3000');
  const [rateLimit, setRateLimit] = useLS('s_rate_limit', true);
  const [sanitize, setSanitize] = useLS('s_sanitize', true);
  const [authEnabled, setAuthEnabled] = useLS('s_auth', false);

  React.useEffect(() => {
    setMounted(true);
    fetch('/api/shipments').then(r => setBackendOk(r.ok)).catch(() => setBackendOk(false));
  }, []);

  const save = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Sync settings to backend .env file
    try {
      const settingsData = {
        corsOrigin,
        backendKey,
        geminiKey,
        circleKey,
        stablefxKey,
        currency,
        minPay,
        maxPay,
        buyerWallet,
        suppWallet,
      };
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('Settings synced to .env:', result.message);
      } else {
        console.error('Failed to sync settings to backend');
      }
    } catch (err) {
      console.error('Error syncing settings to backend:', err);
    }
  };
  const reset = () => {
    if (!confirm('Reset all settings to defaults?')) return;
    setCurrency('USDC'); setMinPay('0.01'); setMaxPay('10000000');
    setBuyerWallet('WALLET_BUYER001'); setSuppWallet('WALLET_SUPPLIER001');
    setFxEnabled(false); setAutoApprove(true);
    setNEvents(true); setNAI(true); setNPayments(true); setNErrors(true); setNSound(false);
    setCorsOrigin('http://localhost:3000'); setRateLimit(true); setSanitize(true); setAuthEnabled(false);
  };

  const themeOptions = [
    { value: 'light', Icon: Sun, label: 'Light' },
    { value: 'dark', Icon: Moon, label: 'Dark' },
    { value: 'system', Icon: Monitor, label: 'System' },
  ];

  return (
    <DashboardLayout title="Settings" subtitle="Configure platform, APIs, wallets, and preferences">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Platform Settings</h2>
            <p className="text-xs text-muted-foreground">Settings saved locally. Restart backend to apply API key changes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset} className="text-xs gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={save} className={cn('text-xs gap-1.5', saved && 'bg-emerald-600 hover:bg-emerald-600')}>
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <Section icon={Monitor} title="Appearance" desc="Theme and display preferences">
          <Row label="Theme" desc="Choose between light, dark, or system theme">
            {mounted ? (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
                {themeOptions.map(({ value, Icon, label }) => (
                  <button key={value} onClick={() => setTheme(value)}
                    className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                      theme === value ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground')}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            ) : <div className="h-9 w-48 rounded-lg bg-muted/30 shimmer" />}
          </Row>
          <Separator />
          <Row label="Sidebar style" desc="Sidebar adapts to the selected theme">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" /> Modern Navy
            </span>
          </Row>
        </Section>

        <Section icon={Wallet} title="Web3 Wallet" desc="Connect your wallet to sign transactions on Arc"
          accent="text-violet-400" bg="bg-violet-500/10 border-violet-500/20">
          <WalletSection />
        </Section>

        <Section icon={Key} title="API Configuration" desc="API keys for Gemini AI, Circle, Arc, and StableFX"
          accent="text-amber-400" bg="bg-amber-500/10 border-amber-500/20">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Keys stored in localStorage for demo. Use server-side .env in production.
            </p>
          </div>
          <Row label="Gemini API Key" desc="Google AI Studio key for gemini-1.5-flash">
            <MaskedInput value={geminiKey} onChange={setGeminiKey} placeholder="AIza…" />
          </Row>
          <Separator />
          <Row label="Circle API Key" desc="Circle developer API key for programmable wallets">
            <MaskedInput value={circleKey} onChange={setCircleKey} placeholder="TEST_API_KEY:…" />
          </Row>
          <Separator />
          <Row label="Arc RPC URL" desc="Arc blockchain RPC endpoint">
            <input type="text" value={arcRpc} onChange={e => setArcRpc(e.target.value)}
              className="w-72 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </Row>
          <Separator />
          <Row label="StableFX API Key" desc="StableFX key for cross-currency FX settlement">
            <MaskedInput value={stablefxKey} onChange={setStablefxKey} placeholder="sfx_…" />
          </Row>
          <Separator />
          <Row label="Backend API Key" desc="Optional X-API-Key header for backend auth">
            <MaskedInput value={backendKey} onChange={setBackendKey} placeholder="Leave blank to disable" />
          </Row>
          <div className="flex flex-wrap gap-3 pt-1">
            {[
              { href: 'https://aistudio.google.com/app/apikey', label: 'Get Gemini API key' },
              { href: 'https://console.circle.com', label: 'Circle Console' },
              { href: 'https://arc.io/developers', label: 'Arc Developer Docs' },
            ].map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                <ExternalLink className="h-3 w-3" />{l.label}
              </a>
            ))}
          </div>
        </Section>

        <Section icon={CreditCard} title="Payment Settings" desc="Configure payment limits, currencies, and wallet IDs"
          accent="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20">
          <Row label="Default Currency" desc="Asset used for settlement payments">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
              {['USDC', 'EURC', 'USDT'].map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    currency === c ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground')}>
                  {c}
                </button>
              ))}
            </div>
          </Row>
          <Separator />
          <Row label="Minimum Payment ($)" desc="Minimum allowed payment amount">
            <input type="number" value={minPay} onChange={e => setMinPay(e.target.value)} min="0.01" step="0.01"
              className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </Row>
          <Separator />
          <Row label="Maximum Payment ($)" desc="Maximum allowed payment amount">
            <input type="number" value={maxPay} onChange={e => setMaxPay(e.target.value)} min="1" step="1"
              className="w-36 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </Row>
          <Separator />
          <Row label="Buyer Wallet ID" desc="Circle wallet ID for the buyer (payer)">
            <input type="text" value={buyerWallet} onChange={e => setBuyerWallet(e.target.value)}
              className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </Row>
          <Separator />
          <Row label="Supplier Wallet ID" desc="Circle wallet ID for the supplier (payee)">
            <input type="text" value={suppWallet} onChange={e => setSuppWallet(e.target.value)}
              className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </Row>
          <Separator />
          <Row label="StableFX / FX Conversion" desc="Enable automatic FX conversion for multi-currency payouts">
            <Toggle on={fxEnabled} set={setFxEnabled} />
          </Row>
          <Separator />
          <Row label="Auto-approve AI decisions" desc="Automatically release payment when Gemini approves delivery">
            <Toggle on={autoApprove} set={setAutoApprove} />
          </Row>
        </Section>

        <Section icon={Bell} title="Notifications" desc="Configure which agent events trigger notifications"
          accent="text-blue-400" bg="bg-blue-500/10 border-blue-500/20">
          <Row label="IoT Events" desc="Notify when a new IoT delivery event is received">
            <Toggle on={nEvents} set={setNEvents} />
          </Row>
          <Separator />
          <Row label="AI Decisions" desc="Notify when Gemini makes a payment decision">
            <Toggle on={nAI} set={setNAI} />
          </Row>
          <Separator />
          <Row label="Payment Events" desc="Notify on payment submitted or confirmed">
            <Toggle on={nPayments} set={setNPayments} />
          </Row>
          <Separator />
          <Row label="Errors" desc="Notify when the agent encounters an error">
            <Toggle on={nErrors} set={setNErrors} />
          </Row>
          <Separator />
          <Row label="Sound alerts" desc="Play a sound when a new notification arrives">
            <Toggle on={nSound} set={setNSound} />
          </Row>
        </Section>

        <Section icon={Shield} title="Security" desc="Backend security controls and access policies"
          accent="text-red-400" bg="bg-red-500/10 border-red-500/20">
          <Row label="CORS Allowed Origin" desc="Frontend origin allowed to access the backend API">
            <input type="text" value={corsOrigin} onChange={e => setCorsOrigin(e.target.value)}
              className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </Row>
          <Separator />
          <Row label="Rate Limiting" desc="Limit POST /events to 30 req/min, read endpoints to 120 req/min">
            <Toggle on={rateLimit} set={setRateLimit} />
          </Row>
          <Separator />
          <Row label="Prompt Injection Sanitization" desc="Strip control characters from event data before Gemini prompt">
            <Toggle on={sanitize} set={setSanitize} />
          </Row>
          <Separator />
          <Row label="API Key Authentication" desc="Require X-API-Key header on all backend endpoints">
            <Toggle on={authEnabled} set={setAuthEnabled} />
          </Row>
          <div className="rounded-lg border border-border bg-muted/20 p-3 mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Security Posture</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'CORS restricted', ok: true },
                { label: 'Helmet headers', ok: true },
                { label: 'Zod validation', ok: true },
                { label: 'Rate limiting', ok: true },
                { label: 'Prompt injection', ok: true },
                { label: 'API key redaction', ok: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{item.label}</span>
                  <Badge ok={item.ok} label={item.ok ? 'Enabled' : 'Disabled'} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section icon={Activity} title="System Status" desc="Backend connectivity and service health"
          accent="text-cyan-400" bg="bg-cyan-500/10 border-cyan-500/20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Backend API</p>
              {backendOk === null ? (
                <div className="h-5 w-20 rounded bg-muted/30 shimmer" />
              ) : (
                <Badge ok={backendOk} label={backendOk ? 'Online' : 'Offline'} />
              )}
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">SSE Stream</p>
              <Badge ok label="Active" />
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">AI Engine</p>
              <Badge ok={geminiKey.length > 0} label={geminiKey.length > 0 ? 'Gemini' : 'Mock'} />
            </div>
          </div>
          <Separator />
          <Row label="Frontend version" desc="Current build version">
            <span className="text-xs font-mono text-muted-foreground">1.0.0</span>
          </Row>
          <Row label="Backend version" desc="AgenticSCM service version">
            <span className="text-xs font-mono text-muted-foreground">1.0.0</span>
          </Row>
          <Row label="API rewrite" desc="Next.js /api/* → localhost:8000/*">
            <Badge ok label="Configured" />
          </Row>
        </Section>
      </div>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          AgenticSCM — Autonomous Supply Chain Settlement • Built for Arc × Encode Hackathon
        </p>
      </div>
    </DashboardLayout>
  );
}
