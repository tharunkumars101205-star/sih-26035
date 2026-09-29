/**
 * METRALAB - Non-Automatic Weighing Instruments (NAWI) Platform Server
 * Production-ready Express server supporting static SPA hosting,
 * health checks, metrology API helpers, and Vite development middleware.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json());

// Health Check for Cloud Run / Container readiness
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'METRALAB NAWI Testing & Report Platform',
    standards: ['OIML R 76-1:2006', 'Legal Metrology Rules 2011'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Quick Metrology Calculation API for external integration / verification
app.post('/api/calculate-mpe', (req: Request, res: Response) => {
  try {
    const { load, scaleInterval, accuracyClass, isInitialVerification = true } = req.body;
    if (load === undefined || scaleInterval === undefined || !accuracyClass) {
      res.status(400).json({ error: 'Missing required parameters: load, scaleInterval, accuracyClass' });
      return;
    }

    const n = Number(load) / Number(scaleInterval);
    const mpeFactor = isInitialVerification ? 1 : 2;
    let baseMpe = 1;

    switch (accuracyClass) {
      case 'I':
        if (n <= 50000) baseMpe = 0.5;
        else if (n <= 200000) baseMpe = 1.0;
        else baseMpe = 1.5;
        break;
      case 'II':
        if (n <= 5000) baseMpe = 0.5;
        else if (n <= 20000) baseMpe = 1.0;
        else baseMpe = 1.5;
        break;
      case 'III':
        if (n <= 500) baseMpe = 0.5;
        else if (n <= 2000) baseMpe = 1.0;
        else baseMpe = 1.5;
        break;
      case 'IIII':
        if (n <= 50) baseMpe = 0.5;
        else if (n <= 200) baseMpe = 1.0;
        else baseMpe = 1.5;
        break;
      default:
        baseMpe = 1.0;
    }

    const mpeValue = baseMpe * mpeFactor * Number(scaleInterval);

    res.json({
      load: Number(load),
      scaleInterval: Number(scaleInterval),
      intervalsCount_n: n,
      accuracyClass,
      isInitialVerification,
      mpeIntervals: baseMpe * mpeFactor,
      mpeAbsoluteValue: mpeValue,
      formula: `±${baseMpe * mpeFactor} × e (e = ${scaleInterval})`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Calculation failed', message });
  }
});

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distIndex);

  if (isProduction && fs.existsSync(distPath)) {
    // Production Mode: Serve compiled SPA
    console.log(`[METRALAB] Serving production bundle from: ${distPath}`);
    app.use(express.static(distPath, { maxAge: '1h', index: false }));

    // SPA fallback: Return index.html for all non-API GET requests
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(distIndex);
    });
  } else {
    // Development Mode: Use Vite dev middleware
    console.log('[METRALAB] Launching in development mode with Vite middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    app.get('*', async (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: unknown) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 METRALAB Server is running!`);
    console.log(`📡 Local:   http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${HOST}:${PORT}`);
    console.log(`📊 Mode:    ${isProduction ? 'PRODUCTION (SPA + API)' : 'DEVELOPMENT (Vite)'}`);
    console.log(`==================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('[METRALAB Server Fatal Error]:', err);
  process.exit(1);
});
