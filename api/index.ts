/**
 * CaseSetu — Vercel Serverless Function Handler
 * Routes all /api/* requests to the full-featured Express API router
 */

import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../server/apiRouter';

const app = express();

// Disable etag to prevent caching issues in serverless
app.set('etag', false);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global CORS & Header Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-user-role, x-user-id'
  );
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Mount the versioned API router at all possible path prefixes
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);

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

// Fallback error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error in Vercel Serverless:', err);
  res.status(500).json({
    error: err?.message || 'Internal Server Error',
    status: 'ERROR',
  });
});

export default app;
export { app };
