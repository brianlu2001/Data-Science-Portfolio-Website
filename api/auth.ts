import { z } from 'zod';
import { endpoint, checkOrigin, requireAuth, rateLimit, clientKey, passwordMatches, createSession, revoke, setSessionCookie, HttpError } from '../lib/security.js';
import { parse } from '../lib/validation.js';
export default endpoint(['GET', 'POST'], async (req, res) => {
  const action = req.query.action;
  if (req.method === 'POST' && action !== 'logout') {
    const { password } = parse(z.object({ password: z.string().min(1).max(256) }), req.body);
    await rateLimit('login:' + clientKey(req), 10, 900, res);
    await rateLimit('login:global', 50, 900, res);
    if (!passwordMatches(password)) throw new HttpError(401, 'Incorrect password');
    setSessionCookie(res, await createSession(req));
    return res.json({ success: true });
  }
  if (action === 'user' && req.method === 'GET') {
    await requireAuth(req);
    return res.json({ id: 'admin', email: 'admin@portfolio.local' });
  }
  if (action === 'logout' && req.method === 'POST') {
    checkOrigin(req);
    await revoke(req);
    setSessionCookie(res, '');
    return res.json({ success: true });
  }
  throw new HttpError(400, 'Invalid request');
});
