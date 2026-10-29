/**
 * CaseSetu — Vercel Serverless Function Handler
 * Routes all /api/* requests to the full-featured Express API router
 */

import express, { Request, Response } from 'express';
import { apiRouter } from '../server/apiRouter';

const app = express();

app.use(express.json());

// Mount the versioned API router at /api/v1 and /v1 and root
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);
app.use('/api', apiRouter);

// Base ping route for /api
app.get('/', (req: Request, res: Response) => {
  res.json({
    platform: 'CaseSetu — AICTE Case Intelligence & Risk Assessment System',
    problemStatement: 'SIH26264',
    status: 'ONLINE',
    runtime: 'Vercel Serverless Node.js',
    endpoints: {
      health: '/api/v1/health',
      docs: '/api/v1/docs',
      login: '/api/v1/auth/login',
      cases: '/api/v1/cases',
      institutions: '/api/v1/institutions',
      conflicts: '/api/v1/conflicts',
      suggestions: '/api/v1/linking/suggestions',
      dashboard: '/api/v1/dashboard',
    },
  });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
