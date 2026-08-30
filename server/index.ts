import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './routes/api.js';
import { seedDatabase } from './db/seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend Vite dev server (port 5173 / localhost)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'MediKiosk AI Clinical Intake API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-SIH2026',
    mode: 'DEMO_AND_INTEGRATION_READY'
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

// Auto-seed database on server start if needed
seedDatabase(false);

const server = app.listen(PORT, () => {
  console.log(`[MediKiosk] Server running on http://localhost:${PORT}`);
  console.log(`[MediKiosk] Health check at http://localhost:${PORT}/health`);
  console.log(`[MediKiosk] API root at http://localhost:${PORT}/api`);
});

export default app;
