// Vercel API entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes-vercel';

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes once
let initialized = false;
const init = async () => {
  if (!initialized) {
    await registerRoutes(app);
    app.use(express.static('public'));
    app.use('/uploads', express.static('uploads'));
    initialized = true;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await init();
  app(req as any, res as any);
}