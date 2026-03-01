import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { evaluateDelivery, isPaid, markPaid, logDecision, appendLog } from './agent';
import { sendPayment, confirmPayment } from './payments';
import { requestFXQuote, acceptFXQuote, updateLedger } from './stablefx';

const app = express();

// ─── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow SSE from frontend
}));

// ─── CORS — restrict to known frontend origin ─────────────────────────────────
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

// ─── Body size limit (prevent DoS via large payloads) ────────────────────────
app.use(express.json({ limit: '16kb' }));

// ─── Optional API-key guard (set BACKEND_API_KEY in .env to enable) ───────────
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  if (!BACKEND_API_KEY) return next(); // disabled when key not configured
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== BACKEND_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const eventsLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 30,               // max 30 event triggers per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down' },
});

const logsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,              // generous for dashboard polling
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// ─── Allowed currencies whitelist ─────────────────────────────────────────────
const ALLOWED_CURRENCIES = new Set(['USDC', 'EURC', 'USDT']);
const MAX_PAYMENT_AMOUNT = 10_000_000; // $10M ceiling
const MIN_PAYMENT_AMOUNT = 0.01;

// ─── Zod schema for incoming IoT events ──────────────────────────────────────
const IoTEventSchema = z.object({
  shipment_id:       z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  event_type:        z.string().min(1).max(64),
  delivery_location: z.string().max(256).optional(),
  location:          z.string().max(256).optional(),
  invoice_id:        z.string().max(64).optional(),
  invoice_amount:    z.number().positive().max(MAX_PAYMENT_AMOUNT).optional(),
  currency:          z.string().max(8).optional(),
  temperature_ok:    z.boolean().optional(),
  weight_kg:         z.number().positive().optional(),
  buyer_id:          z.string().max(64).optional(),
  supplier_id:       z.string().max(64).optional(),
  timestamp:         z.string().optional(),
  proof_type:        z.string().max(32).optional(),
  proof_payload:     z.string().max(512).optional(),
  sensor_id:         z.string().max(64).optional(),
}).strict();

const LOG_FILE = path.join(__dirname, '../logs/events.log');

// ─── SSE clients registry ─────────────────────────────────────────────────────
const sseClients = new Set<Response>();

// ─── Broadcast a new log line to all SSE clients ──────────────────────────────
function broadcastLog(line: string) {
  for (const client of sseClients) {
    client.write(`data: ${line}\n\n`);
  }
}

// Wrap appendLog to also broadcast over SSE — reuses the same entry/timestamp
function appendAndBroadcast(type: Parameters<typeof appendLog>[0], data: Parameters<typeof appendLog>[1]) {
  const entry = appendLog(type, data);
  broadcastLog(JSON.stringify(entry));
}

// ─── POST /events — main delivery event handler ───────────────────────────────
app.post('/events', eventsLimiter, requireApiKey, async (req: Request, res: Response) => {
  // ── 1. Validate & sanitize input with Zod ──────────────────────────────────
  const parsed = IoTEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid event payload',
      details: parsed.error.flatten().fieldErrors,
    });
  }
  const event = parsed.data;

  try {
    // ── 2. Evaluate delivery (logs EVENT_RECEIVED + AI_DECISION internally) ──
    const decision = await evaluateDelivery(event);
    logDecision(event.shipment_id, decision);

    if (typeof decision !== 'object' || decision === null) {
      throw new Error('AI decision is not an object');
    }
    if (!('release_payment' in decision) || !('reasoning' in decision) || !('approved_amount' in decision) || !('currency' in decision)) {
      throw new Error('AI decision missing required fields');
    }
    if (!decision.release_payment) {
      return res.status(200).json({ status: 'not-approved', reasoning: decision.reasoning });
    }

    // ── 3. Idempotency ────────────────────────────────────────────────────────
    if (isPaid(event.shipment_id)) {
      return res.status(200).json({ status: 'already-paid' });
    }

    // ── 4. Currency whitelist guard ───────────────────────────────────────────
    const currency = String(decision.currency).toUpperCase();
    if (!ALLOWED_CURRENCIES.has(currency)) {
      throw new Error(`Currency '${currency}' is not on the approved whitelist`);
    }

    // ── 5. Amount bounds guard ────────────────────────────────────────────────
    const amount = Number(decision.approved_amount);
    if (!isFinite(amount) || amount < MIN_PAYMENT_AMOUNT || amount > MAX_PAYMENT_AMOUNT) {
      throw new Error(`Approved amount ${amount} is outside permitted range (${MIN_PAYMENT_AMOUNT}–${MAX_PAYMENT_AMOUNT})`);
    }

    // ── 6. Build payment instruction ──────────────────────────────────────────
    const instruction = {
      source_wallet_id:      'WALLET_BUYER001',
      destination_wallet_id: 'WALLET_SUPPLIER001',
      asset:                 currency,
      amount,
      fx_required:           false,
      shipment_ref:          event.shipment_id,
      invoice_ref:           event.invoice_id ?? undefined,
      metadata:              { event_id: event.shipment_id },
    };

    appendAndBroadcast('PAYMENT_SUBMITTED', {
      shipment_id: event.shipment_id,
      asset:       instruction.asset,
      amount:      instruction.amount,
      source:      instruction.source_wallet_id,
      destination: instruction.destination_wallet_id,
    });

    const paymentRes = await sendPayment(instruction);
    markPaid(event.shipment_id);

    if (
      !paymentRes ||
      typeof paymentRes !== 'object' ||
      !('data' in paymentRes) ||
      typeof paymentRes.data !== 'object' ||
      paymentRes.data === null ||
      !('transaction_hash' in paymentRes.data)
    ) {
      throw new Error('Payment response missing transaction_hash');
    }

    const txHash = (paymentRes.data as any).transaction_hash;
    const confirmation = await confirmPayment(txHash);

    appendAndBroadcast('PAYMENT_CONFIRMED', {
      shipment_id:      event.shipment_id,
      transaction_hash: txHash,
      confirmation:     confirmation.data,
    });

    res.status(200).json({ status: 'paid', confirmation: confirmation.data });

  } catch (err) {
    // ── 7. Sanitize error — never leak internal details to client ─────────────
    const internal = err instanceof Error ? err.message : String(err);
    console.error('[POST /events] ERROR', internal);
    appendAndBroadcast('ERROR', { shipment_id: event?.shipment_id, error: internal });

    // Return a safe, generic message unless it's a known business-logic error
    const safeMessages = [
      'not-approved', 'already-paid', 'Currency', 'amount', 'AI decision',
    ];
    const isSafe = safeMessages.some((s) => internal.includes(s));
    res.status(500).json({ error: isSafe ? internal : 'Payment processing failed' });
  }
});

// ─── GET /logs — return all parsed log entries ────────────────────────────────
app.get('/logs', logsLimiter, requireApiKey, (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json([]);
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
    res.json(lines);
  } catch {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

// ─── GET /logs/stream — SSE real-time log stream ──────────────────────────────
// Note: rate limiting is not applied here because SSE is a long-lived connection.
// The SSE client limit (MAX_SSE_CLIENTS) prevents resource exhaustion instead.
const MAX_SSE_CLIENTS = 20;

app.get('/logs/stream', requireApiKey, (req: Request, res: Response) => {
  // Reject if too many SSE clients are already connected
  if (sseClients.size >= MAX_SSE_CLIENTS) {
    return res.status(503).json({ error: 'Too many live stream connections' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Use specific origin instead of wildcard
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.flushHeaders();

  // Send all existing logs on connect
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, 'utf-8');
      raw.split('\n').filter((l) => l.trim()).forEach((line) => {
        res.write(`data: ${line}\n\n`);
      });
    }
  } catch {}

  // Register client
  sseClients.add(res);

  // ── Per-client fs.watch (fixes the shared-watcher leak bug) ─────────────────
  // fs.watchFile() shares a single watcher per path — calling unwatchFile()
  // removes it for ALL listeners. Use fs.watch() per client instead.
  let fileSize = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE).size : 0;
  let watcher: fs.FSWatcher | null = null;

  try {
    watcher = fs.watch(LOG_FILE, () => {
      try {
        const stat = fs.statSync(LOG_FILE);
        if (stat.size > fileSize) {
          const fd = fs.openSync(LOG_FILE, 'r');
          const newBytes = stat.size - fileSize;
          const buf = Buffer.alloc(newBytes);
          fs.readSync(fd, buf, 0, newBytes, fileSize);
          fs.closeSync(fd);
          buf.toString('utf-8').split('\n').filter((l) => l.trim()).forEach((line) => {
            res.write(`data: ${line}\n\n`);
          });
          fileSize = stat.size;
        }
      } catch {}
    });
  } catch {
    // If watch fails (e.g. file doesn't exist yet), fall back gracefully
  }

  // Heartbeat every 15s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    sseClients.delete(res);
    watcher?.close(); // only closes THIS client's watcher
    clearInterval(heartbeat);
  });
});

// ─── GET /shipments — return shipment list ────────────────────────────────────
app.get('/shipments', logsLimiter, (_req: Request, res: Response) => {
  try {
    const shipmentsPath = path.join(__dirname, '../simulator/shipments.json');
    const data = JSON.parse(fs.readFileSync(shipmentsPath, 'utf-8'));
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to read shipments' });
  }
});

// ─── GET /payments — return payment log entries ───────────────────────────────
app.get('/payments', logsLimiter, requireApiKey, (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json([]);
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean)
      .filter((e: any) => e.type === 'PAYMENT_SUBMITTED' || e.type === 'PAYMENT_CONFIRMED');
    res.json(lines);
  } catch {
    res.status(500).json({ error: 'Failed to read payments' });
  }
});

// ─── POST /settings — save settings to .env file ───────────────────────────────
app.post('/settings', requireApiKey, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const envPath = path.join(__dirname, '../.env');
    
    // Build .env content from settings
    const envLines: string[] = [
      '# ============================================',
      '# AgenticSCM Environment Configuration',
      '# ============================================',
      '',
      '# --- Frontend ---',
      `FRONTEND_ORIGIN=${settings.corsOrigin || 'http://localhost:3000'}`,
      '',
      '# --- Backend Security (optional) ---',
      settings.backendKey ? `BACKEND_API_KEY=${settings.backendKey}` : '# BACKEND_API_KEY=your_secure_api_key_here',
      '',
      '# --- Google Gemini AI ---',
      settings.geminiKey ? `GEMINI_API_KEY=${settings.geminiKey}` : '# GEMINI_API_KEY=',
      '',
      '# --- Circle Programmable Wallets ---',
      settings.circleKey ? `CIRCLE_API_KEY=${settings.circleKey}` : '# CIRCLE_API_KEY=',
      settings.circleWalletSetId ? `CIRCLE_WALLET_SET_ID=${settings.circleWalletSetId}` : '# CIRCLE_WALLET_SET_ID=',
      settings.circlePaymasterConfig ? `CIRCLE_PAYMASTER_CONFIG=${settings.circlePaymasterConfig}` : '# CIRCLE_PAYMASTER_CONFIG=',
      '',
      '# --- StableFX (FX Layer) ---',
      settings.stablefxEndpoint ? `STABLEFX_ENDPOINT=${settings.stablefxEndpoint}` : '# STABLEFX_ENDPOINT=',
      settings.stablefxKey ? `STABLEFX_API_KEY=${settings.stablefxKey}` : '# STABLEFX_API_KEY=',
      '',
      '# --- Arc Network (Blockchain) ---',
      settings.arcEndpoint ? `ARC_ENDPOINT=${settings.arcEndpoint}` : '# ARC_ENDPOINT=',
      settings.arcApiKey ? `ARC_API_KEY=${settings.arcApiKey}` : '# ARC_API_KEY=',
      settings.arcX402Url ? `ARC_X402_URL=${settings.arcX402Url}` : '# ARC_X402_URL=',
    ];

    fs.writeFileSync(envPath, envLines.join('\n'), 'utf-8');
    
    res.json({ success: true, message: 'Settings saved to .env file. Please restart the backend to apply changes.' });
  } catch (err) {
    console.error('[POST /settings] ERROR', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ─── GET /settings — read current settings from .env file ───────────────────────
app.get('/settings', requireApiKey, (_req: Request, res: Response) => {
  try {
    const envPath = path.join(__dirname, '../.env');
    
    if (!fs.existsSync(envPath)) {
      return res.json({});
    }
    
    const raw = fs.readFileSync(envPath, 'utf-8');
    const settings: Record<string, string> = {};
    
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        settings[key] = value;
      }
    });
    
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(8000, () => {
  console.log('AgenticSCM Agent Service running on http://localhost:8000');
  if (BACKEND_API_KEY) {
    console.log('[Security] API key authentication: ENABLED');
  } else {
    console.log('[Security] API key authentication: DISABLED (set BACKEND_API_KEY to enable)');
  }
  console.log(`[Security] CORS origin: ${ALLOWED_ORIGIN}`);
});
