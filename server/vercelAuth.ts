// Legacy entry points delegate to the same authorization used by the API.
import type { Express, RequestHandler } from 'express';
import type { VercelRequest, VercelResponse } from '../lib/http.js';
import { requireAuth, endpoint } from '../lib/security.js';
import auth from '../api/auth.js';
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const guard = endpoint(['GET','POST','PUT','DELETE'], async (request) => { await requireAuth(request); next(); });
  void guard(req as unknown as VercelRequest, res as unknown as VercelResponse);
};
export async function setupAuth(app: Express) {
  app.all('/api/auth', (req, res) => { void auth(req as unknown as VercelRequest, res as unknown as VercelResponse); });
}
