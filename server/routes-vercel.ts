import type { Express } from 'express';
import { createServer } from 'node:http';
import { apiRouter } from './api-router.js';
export async function registerRoutes(app: Express) {
  app.use('/api', apiRouter());
  return createServer(app);
}
