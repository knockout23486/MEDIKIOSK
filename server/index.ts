import { config as loadEnv } from 'dotenv';
loadEnv();

import express, { type Express } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './routes/api.js';
import { db, DATABASE_URL } from './db/store.js';
import { seedDatabase } from './db/seed.js';

const app: Express = express();
const PORT = Number(process.env.PORT || 3001);

// Enable CORS for frontend Vite dev server (port 5173 / localhost)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Endpoint (includes live PostgreSQL connectivity probe)
app.get('/health', async (_req, res) => {
  const probe = await db.ping();
  res.status(probe.ok ? 200 : 503).json({
    status: probe.ok ? 'HEALTHY' : 'DEGRADED',
    service: 'MediKiosk AI Clinical Intake API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-SIH2026',
    mode: 'DEMO_AND_INTEGRATION_READY',
    database: {
      engine: 'postgresql',
      connected: probe.ok,
      serverVersion: probe.serverVersion,
      latencyMs: probe.latencyMs,
      ...(probe.error ? { error: probe.error } : {})
    }
  });
});

// API Routes
app.use('/api', apiRouter);

// Serve static build in production if available
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export function createApp(): Express {
  return app;
}

/**
 * Boot sequence: verify the relational database is reachable, apply pending
 * SQL migrations, seed the demo dataset when the schema is empty, then listen.
 */
async function main() {
  const probe = await db.ping();
  if (!probe.ok) {
    console.error('[MediKiosk] FATAL: cannot reach PostgreSQL at', DATABASE_URL);
    console.error('[MediKiosk]        ', probe.error);
    console.error('[MediKiosk]         Start the database (docker compose up db) and retry.');
    process.exit(1);
  }
  console.log(`[MediKiosk] Connected to PostgreSQL ${probe.serverVersion} (${probe.latencyMs}ms)`);

  await db.migrate();
  await seedDatabase(false);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediKiosk] Server running on http://localhost:${PORT}`);
    console.log(`[MediKiosk] Health check at http://localhost:${PORT}/health`);
    console.log(`[MediKiosk] API root at http://localhost:${PORT}/api`);
  });
}

// Run only when executed directly (tests import createApp() instead).
if (process.argv[1]?.includes('index')) {
  main().catch((err) => {
    console.error('[MediKiosk] Boot failed:', err);
    process.exit(1);
  });
}
