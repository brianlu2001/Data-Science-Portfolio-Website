// Isolated local app: does not read .env.local or connect to external services.
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { localDatabase } from './local-database.js';
import { useLocalDatabase } from '../lib/database.js';
import { useLocalUploads } from '../lib/uploads.js';
import { apiRouter } from '../server/api-router.js';
if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('Use the production server');
process.env.NODE_ENV = 'development';
delete process.env.DATABASE_URL;
delete process.env.OPENAI_API_KEY;
delete process.env.BLOB_READ_WRITE_TOKEN;
await fs.mkdir('.local', { recursive: true });
const credentialsPath = '.local/credentials.json';
let credentials: { password: string; secret: string };
try { credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8')); }
catch {
  credentials = { password: randomBytes(18).toString('base64url'), secret: randomBytes(32).toString('hex') };
  await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { flag: 'wx', mode: 0o600 });
}
process.env.ADMIN_PASSWORD = credentials.password;
process.env.SESSION_SECRET = credentials.secret;
await fs.writeFile('.local/LOGIN.md', '# Local testing\n\nOpen http://127.0.0.1:5173/admin\n\nPassword: ' + credentials.password + '\n\nLocal data and credentials only; changes do not affect production.\n');
const { pool } = await localDatabase('.local/database');
useLocalDatabase(pool);
useLocalUploads(path.resolve('.local/uploads'));
if (!(await pool.query('SELECT id FROM projects LIMIT 1')).rows.length) {
  let seed: { projects: any[]; settings: any };
  try { seed = JSON.parse(await fs.readFile('.local/seed.json','utf8')); }
  catch { seed = { projects: [{ id:1,title:'Local test project',simplifiedDescription:'A safe place to test changes.',fullDescription:'',technologies:[],status:'finished',sortOrder:0 }],settings:{bio:'Local test portfolio'} }; }
  for (const p of seed.projects) await pool.query(`INSERT INTO projects
    (id,title,simplified_description,full_description,technologies,category,image_url,project_url,github_url,status,sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [p.id,p.title,p.simplifiedDescription,p.fullDescription||'',p.technologies||[],p.category,p.imageUrl,p.projectUrl,p.githubUrl,p.status||'finished',p.sortOrder||0]);
  await pool.query(`SELECT setval('projects_id_seq',COALESCE((SELECT MAX(id) FROM projects),0)+1,false)`);
  const s = seed.settings;
  await pool.query(`INSERT INTO site_settings(id,contact_email,contact_phone,bio,linkedin_url,logo_urls)
    VALUES(1,$1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING`, [s.contactEmail,s.contactPhone,s.bio,s.linkedinUrl,s.logoUrls||[]]);
}
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use((_req,res,next) => { res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN'); next(); });
app.use('/api', apiRouter());
app.use('/local-files', express.static(path.resolve('.local/uploads'), {
  setHeaders(res, file) { if (!file.endsWith('.webp')) res.setHeader('Content-Disposition','attachment'); },
}));
app.use('/uploads', express.static('uploads'));
app.use('/reports', (_req,res,next) => {
  res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-downloads; frame-ancestors 'self'");
  next();
});
const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
app.use(vite.middlewares);
app.use((err: any,_req: express.Request,res: express.Response,_next: express.NextFunction) => {
  res.status(err.type === 'entity.too.large' ? 413 : 400).json({ message:'Invalid request' });
});
app.listen(5173,'127.0.0.1', () => console.log('Isolated local portfolio: http://127.0.0.1:5173 — password saved in .local/credentials.json'));
