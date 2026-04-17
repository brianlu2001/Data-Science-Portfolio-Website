import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

// --- Auth helpers (inlined to avoid Vercel ESM module resolution issues) ---
function createToken(secret: string): string {
  const payload = Date.now().toString();
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}

function verifyToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const dotIndex = decoded.lastIndexOf('.');
    const payload = decoded.slice(0, dotIndex);
    const sig = decoded.slice(dotIndex + 1);
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

function isAdminAuthenticated(req: VercelRequest): boolean {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/admin_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  return verifyToken(token, secret);
}
// --- End auth helpers ---

const COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

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
    const match = a.length === b.length && timingSafeEqual(a, b);

    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = createToken(sessionSecret);
    setCookie(res, token);
    return res.json({ success: true });
  }

  const { action } = req.query;

  if (action === 'user') {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.json({ id: 'admin', email: 'admin@portfolio.local' });
  }

  if (action === 'logout') {
    clearCookie(res);
    return res.redirect(302, '/');
  }

  return res.status(400).json({ message: 'Invalid request' });
}
