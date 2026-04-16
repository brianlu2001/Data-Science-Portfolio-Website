import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function createToken(secret: string): string {
  const payload = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const dotIndex = decoded.lastIndexOf('.');
    const payload = decoded.slice(0, dotIndex);
    const sig = decoded.slice(dotIndex + 1);
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function getAuthToken(req: VercelRequest): string | null {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function isAdminAuthenticated(req: VercelRequest): boolean {
  const token = getAuthToken(req);
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  return verifyToken(token, secret);
}

// Returns false and sends 401 if not authenticated
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return true;
}
