import express from 'express';
import path from 'node:path';
import { apiRouter } from './api-router.js';
process.env.NODE_ENV ??= 'production';
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'");
  next();
});
app.use('/api', apiRouter());
app.use('/reports', (_req,res,next) => {
  res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-downloads; frame-ancestors 'self'");
  next();
});
app.use(express.static(path.resolve('dist/public')));
app.get('*', (_req,res) => res.sendFile(path.resolve('dist/public/index.html')));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ message: status === 500 ? 'Internal server error' : 'Invalid request' });
});
app.listen(Number(process.env.PORT || 5000), process.env.HOST || '127.0.0.1', () => console.log('Portfolio server ready'));
