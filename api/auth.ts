import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createToken, isAdminAuthenticated } from './_authHelper';

const COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 1 week in seconds

function setCookie(res: VercelResponse, token: string) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/auth — login with password
  if (req.method === 'POST') {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ message: 'Server misconfigured: ADMIN_PASSWORD not set' });
    }

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      return res.status(500).json({ message: 'Server misconfigured: SESSION_SECRET not set' });
    }

    const a = Buffer.from(password);
    const b = Buffer.from(adminPassword);
    const match = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = createToken(sessionSecret);
    setCookie(res, token);
    return res.json({ success: true });
  }

  const { action } = req.query;

  // GET /api/auth?action=user — check session status
  if (action === 'user') {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.json({ id: 'admin', email: 'admin@portfolio.local' });
  }

  // GET /api/auth?action=logout — clear session and redirect
  if (action === 'logout') {
    clearCookie(res);
    return res.redirect(302, '/');
  }

  return res.status(400).json({ message: 'Invalid request' });
}
