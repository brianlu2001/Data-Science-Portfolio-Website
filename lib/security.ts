import type { VercelRequest, VercelResponse } from './http.js';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { query } from './database.js';
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const SESSION_SECONDS = 8 * 60 * 60;
const IDLE_SECONDS = 30 * 60;
export function secret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value || value.length < 32) throw new HttpError(503, 'Authentication unavailable');
  return value;
}
export function credentialVersion() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 16) throw new HttpError(503, 'Authentication unavailable');
  return createHmac('sha256', secret()).update(password).digest('hex');
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function cookieToken(req: VercelRequest) {
  try {
    const matches = (req.headers.cookie || '').split(';').map(c => c.trim()).filter(c => c.startsWith('admin_token='));
    if (matches.length !== 1) return null;
    const value = decodeURIComponent(matches[0].slice(12));
    return /^[a-f0-9]{64}$/.test(value) ? value : null;
  } catch { return null; }
}
export async function requireAuth(req: VercelRequest) {
  const token = cookieToken(req);
  if (!token) throw new HttpError(401, 'Unauthorized');
  const result = await query(`UPDATE sessions SET sess = jsonb_set(sess::jsonb, '{lastSeen}', to_jsonb(EXTRACT(EPOCH FROM NOW())::bigint))
    WHERE sid = $1 AND expire > NOW() AND sess::jsonb->>'version' = $2
    AND (sess::jsonb->>'lastSeen')::bigint > EXTRACT(EPOCH FROM NOW()) - $3 RETURNING sid`,
    ['admin:' + hash(token), credentialVersion(), IDLE_SECONDS]);
  if (!result.rows.length) throw new HttpError(401, 'Unauthorized');
}
export async function revoke(req: VercelRequest) {
  const token = cookieToken(req);
  if (token) await query('DELETE FROM sessions WHERE sid = $1', ['admin:' + hash(token)]);
}
export async function createSession(req: VercelRequest) {
  await revoke(req);
  const token = randomBytes(32).toString('hex');
  await query(`INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2::json, NOW() + $3 * interval '1 second')`,
    ['admin:' + hash(token), JSON.stringify({ version: credentialVersion(), lastSeen: Math.floor(Date.now() / 1000) }), SESSION_SECONDS]);
  return token;
}
export function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; Max-Age=${token ? SESSION_SECONDS : 0}; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : ''}`);
}
export function passwordMatches(value: string) {
  credentialVersion();
  return timingSafeEqual(Buffer.from(hash(value)), Buffer.from(hash(process.env.ADMIN_PASSWORD!)));
}
export function checkOrigin(req: VercelRequest) {
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Forbidden origin');
  const origin = req.headers.origin;
  if (!origin) return;
  let allowed: string[];
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    allowed = ['https://www.luki90.com', 'https://luki90.com', ...(process.env.APP_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)];
    if (process.env.VERCEL_URL) allowed.push(`https://${process.env.VERCEL_URL}`);
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) allowed.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  } else allowed = ['http://127.0.0.1:5173', 'http://localhost:5173'];
  if (!allowed.includes(origin)) throw new HttpError(403, 'Forbidden origin');
}
export function clientKey(req: VercelRequest) {
  // Vercel overwrites this header; don't trust forwarded headers off-platform.
  const address = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
  return createHmac('sha256', secret()).update(typeof address === 'string' ? address.split(',')[0].trim() : 'unknown').digest('hex');
}
export async function rateLimit(key: string, limit: number, seconds: number, res: VercelResponse) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const { rows } = await query(`INSERT INTO sessions (sid, sess, expire)
    VALUES ($1, '{"count":1}'::json, NOW() + $2 * interval '1 second')
    ON CONFLICT (sid) DO UPDATE SET sess = json_build_object('count', LEAST((sessions.sess::jsonb->>'count')::int + 1, $3 + 1))
    RETURNING (sess::jsonb->>'count')::int AS count`, [`limit:${hash(key)}:${bucket}`, seconds * 2, limit]);
  await query(`DELETE FROM sessions WHERE sid IN (SELECT sid FROM sessions WHERE expire < NOW()
    AND (sid LIKE 'limit:%' OR sid LIKE 'admin:%') LIMIT 100)`);
  if (rows[0].count > limit) {
    res.setHeader('Retry-After', String(seconds - Math.floor(Date.now() / 1000) % seconds));
    throw new HttpError(429, 'Too many requests. Try again later.');
  }
}
type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;
export function endpoint(methods: string[], handler: Handler): Handler {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (!methods.includes(req.method || '')) {
        res.setHeader('Allow', methods.join(', '));
        throw new HttpError(405, 'Method not allowed');
      }
      if (req.method !== 'GET') checkOrigin(req);
      if (Number(req.headers['content-length']) > 4 * 1024 * 1024) throw new HttpError(413, 'Request too large');
      return await handler(req, res);
    } catch (error) {
      if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
      console.error('API request failed', { path: req.url?.split('?')[0], type: error instanceof Error ? error.name : 'Error' });
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}
