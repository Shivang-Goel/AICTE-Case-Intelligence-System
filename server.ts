/**
 * Main Full-Stack Server Entry Point
 * Runs Express backend on port 3000, mounting /api/v1 REST endpoints
 * and Vite middlewares in development mode.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/apiRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount versioned REST API
  app.use('/api/v1', apiRouter);

  // Quick API documentation / overview route
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'CaseSetu — AICTE Institution-Centric Case Intelligence API',
      version: 'v1',
      endpoints: [
        'POST /api/v1/auth/login',
        'GET /api/v1/auth/me',
        'GET /api/v1/health',
        'GET /api/v1/dashboard',
        'GET /api/v1/cases',
        'POST /api/v1/cases',
        'GET /api/v1/cases/:id',
        'PATCH /api/v1/cases/:id/status',
        'PATCH /api/v1/cases/:id/reassign',
        'PATCH /api/v1/cases/:id/transfer',
        'POST /api/v1/cases/:id/notes',
        'GET /api/v1/institutions',
        'GET /api/v1/institutions/:id',
        'GET /api/v1/linking/suggestions',
        'POST /api/v1/linking/compare',
        'POST /api/v1/linking/suggestions/:id/review',
        'GET /api/v1/conflicts',
        'PATCH /api/v1/conflicts/:id/status',
        'GET /api/v1/severity/queue',
        'POST /api/v1/severity/evaluate',
        'POST /api/v1/severity/override',
        'GET /api/v1/graph',
        'GET /api/v1/workflows/deadlines',
        'GET /api/v1/notifications',
        'GET /api/v1/audit-logs',
      ],
    });
  });

  if (!isProd) {
    // Mount Vite dev server in middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend build in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AICTE Case Intelligence Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[API v1 Mounted] REST API available at http://0.0.0.0:${PORT}/api/v1`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
