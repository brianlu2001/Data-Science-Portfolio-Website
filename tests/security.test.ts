import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { localDatabase } from '../scripts/local-database.js';
import { useLocalDatabase } from '../lib/database.js';
import { useLocalUploads } from '../lib/uploads.js';
import { apiRouter } from '../server/api-router.js';
import { isAuthenticated } from '../server/vercelAuth.js';
import { insertProjectSchema } from '../shared/schema.js';

process.env.NODE_ENV = 'test';
delete process.env.VERCEL;
delete process.env.DATABASE_URL;
delete process.env.OPENAI_API_KEY;
delete process.env.BLOB_READ_WRITE_TOKEN;
process.env.ADMIN_PASSWORD = 'local-test-password-only-12345';
process.env.SESSION_SECRET = 'local-test-signing-secret-not-used-outside-this-test';
const database = await localDatabase();
useLocalDatabase(database.pool);
let server: Server;
let base: string;
let directory: string;
let cookie: string;
const payload = { title:'Security test project',simplifiedDescription:'Test',fullDescription:'Test',technologies:['TypeScript'],status:'finished',sortOrder:0 };
async function request(url: string, method = 'GET', body?: unknown, token?: string, headers: Record<string,string> = {}) {
  return fetch(base + url, { method, redirect:'manual', headers: {
    ...(body === undefined || body instanceof FormData ? {} : { 'Content-Type':'application/json' }),
    ...(token ? { Cookie:token } : {}), ...headers,
  }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
}
async function login() {
  const res = await request('/api/auth','POST',{password:process.env.ADMIN_PASSWORD});
  assert.equal(res.status,200,await res.clone().text());
  const header = res.headers.get('set-cookie')!;
  assert.match(header,/HttpOnly/);
  assert.match(header,/SameSite=Strict/);
  return header.split(';')[0];
}
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(),'portfolio-test-'));
  useLocalUploads(directory);
  await database.pool.query("INSERT INTO site_settings(id,bio) VALUES(1,'Test')");
  const app = express();
  app.use(express.json({limit:'256kb'}));
  app.get('/legacy-guard',isAuthenticated,(_req,res) => res.json({admin:true}));
  app.use('/api',apiRouter());
  app.use((err: any,_req: express.Request,res: express.Response,_next: express.NextFunction) => {
    res.status(err.type === 'entity.too.large' ? 413 : 400).json({message:'Invalid request'});
  });
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
});
after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  await database.db.close();
  await rm(directory,{recursive:true,force:true});
});

test('all admin routes reject anonymous callers before database work', async () => {
  let connections = 0;
  useLocalDatabase({connect:async () => { connections++; throw new Error('Unexpected database access'); },query:async () => {throw new Error('Unexpected query');}});
  try {
    for (const [url,method] of [
      ['/api/auth?action=user','GET'],['/api/projects-simple','POST'],['/api/projects/1','PUT'],['/api/projects/1','DELETE'],
      ['/api/site-settings-simple','PUT'],['/api/update-project-order','PUT'],['/api/upload-image','POST'],
      ['/api/upload-report','POST'],['/api/rewrite-description','POST'],['/api/analytics?action=summary','GET'],['/legacy-guard','GET'],
    ]) assert.equal((await request(url,method,method === 'GET' ? undefined : {})).status,401,url);
    assert.equal(connections,0);
  } finally { useLocalDatabase(database.pool); }
});
test('malformed cookies, login types and unsupported methods are rejected safely', async () => {
  const legacyLogin = await request('/api/auth?action=login');
  assert.equal(legacyLogin.status,302);
  assert.equal(legacyLogin.headers.get('location'),'/admin');
  assert.equal((await request('/api/upload-image','POST',{},'admin_token=%ZZ')).status,401);
  assert.equal((await request('/api/auth','POST',{password:123})).status,400);
  assert.equal((await request('/api/auth','POST',null)).status,400);
  assert.equal((await request('/api/auth','DELETE')).status,405);
  const result = await request('/api/auth','POST',{password:'wrong' },undefined,{Origin:'https://untrusted.example'});
  assert.equal(result.status,403);
  assert.equal(result.headers.get('access-control-allow-origin'),null);
});
test('real PostgreSQL sessions allow login and normal CRUD', async () => {
  cookie = await login();
  assert.equal((await request('/api/auth?action=user','GET',undefined,cookie)).status,200);
  const created = await request('/api/projects-simple','POST',payload,cookie);
  assert.equal(created.status,201,await created.clone().text());
  const p = await created.json();
  assert.equal((await request('/api/projects/'+p.id,'PUT',{...payload,title:'Updated'},cookie)).status,200);
  const read = await (await request('/api/project-by-id?id='+p.id)).json();
  assert.equal(read.title,'Updated');
  assert.equal((await request('/api/update-project-order','PUT',{projects:[{id:p.id,sortOrder:3}]},cookie)).status,200);
  assert.equal((await request('/api/site-settings-simple','PUT',{bio:'Updated',logoUrls:[]},cookie)).status,200);
  await database.pool.query("INSERT INTO project_clicks(project_id,click_type) VALUES($1,'view')",[p.id]);
  await database.pool.query("INSERT INTO project_files(project_id,file_name,file_url,file_type) VALUES($1,'test','/test.pdf','pdf')",[p.id]);
  assert.equal((await request('/api/projects/'+p.id,'DELETE',undefined,cookie)).status,200);
  assert.equal((await request('/api/project-by-id?id='+p.id)).status,404);
});
test('schema validation blocks executable URLs, oversized bodies, invalid IDs and oversized AI input', async () => {
  assert.equal((await request('/api/projects-simple','POST',{...payload,projectUrl:'javascript:alert(1)'},cookie)).status,400);
  assert.equal((await request('/api/projects-simple','POST',{...payload,imageUrl:'//evil.example/a.png'},cookie)).status,400);
  assert.equal((await request('/api/project-by-id?id=1oops')).status,400);
  assert.equal((await request('/api/projects-simple','POST',{...payload,fullDescription:'x'.repeat(300000)},cookie)).status,413);
  assert.equal((await request('/api/rewrite-description','POST',{description:'word '.repeat(3000)},cookie)).status,400);
  assert.equal((await request('/api/rewrite-description','POST',{description:'word '.repeat(61)},cookie)).status,503);
});
test('the client form schema remains compatible with the secured API', async () => {
  const body = insertProjectSchema.parse({ ...payload, projectUrl: '/reports/test report.pdf' });
  const result = await request('/api/projects-simple','POST',body,cookie);
  assert.equal(result.status,201,await result.clone().text());
  const project = await result.json();
  assert.equal(project.projectUrl,'/reports/test%20report.pdf');
  assert.equal((await request('/api/projects/'+project.id,'DELETE',undefined,cookie)).status,200);
});
test('analytics validates and bounds requests without storing visitor identifiers', async () => {
  assert.equal((await request('/api/analytics?action=pageview','POST',{page:'/'})).status,201);
  const row = (await database.pool.query('SELECT * FROM page_views LIMIT 1')).rows[0];
  assert.equal(row.ip_address,null); assert.equal(row.user_agent,null);
  assert.equal((await request('/api/analytics?action=summary&startDate=1900-01-01&endDate=2100-01-01','GET',undefined,cookie)).status,400);
  const result = await request('/api/analytics?action=summary','GET',undefined,cookie);
  assert.equal(result.status,200,await result.clone().text());
  assert.equal((await result.json()).totalPageViews,1);
});
test('uploads reject forged MIME and active content; valid images are decoded and re-encoded', async () => {
  const bad = new FormData();bad.append('image',new Blob(['<script>alert(1)</script>'],{type:'image/png'}),'image.png');
  assert.equal((await request('/api/upload-image','POST',bad,cookie)).status,400);
  const svg = new FormData();svg.append('image',new Blob(['<svg></svg>'],{type:'image/svg+xml'}),'image.svg');
  assert.equal((await request('/api/upload-image','POST',svg,cookie)).status,400);
  const png = await sharp({create:{width:2,height:2,channels:4,background:'#ffffff'}}).png().toBuffer();
  const good = new FormData();good.append('image',new Blob([new Uint8Array(png)],{type:'image/png'}),'safe.png');
  const uploaded = await request('/api/upload-image','POST',good,cookie);
  assert.equal(uploaded.status,200,await uploaded.clone().text());
  assert.match((await uploaded.json()).imageUrl,/^\/local-files\/[a-f0-9-]+\.webp$/);
});
test('four-megabyte report uploads allow multipart overhead but reject larger files', async () => {
  for (const [size,status] of [[4 * 1024 * 1024,200],[4 * 1024 * 1024 + 1,400]]) {
    const bytes = Buffer.alloc(size,32);bytes.write('%PDF-1.7\n');
    const form = new FormData();form.append('report',new Blob([bytes],{type:'application/pdf'}),'boundary.pdf');
    assert.equal((await request('/api/upload-report','POST',form,cookie)).status,status);
  }
});

test('logout revokes a copied cookie', async () => {
  assert.equal((await request('/api/auth?action=logout','POST',undefined,cookie)).status,200);
  assert.equal((await request('/api/auth?action=user','GET',undefined,cookie)).status,401);
});
test('absolute expiry, idle expiry and password/secret changes invalidate sessions', async () => {
  for (const update of [
    "UPDATE sessions SET expire=NOW()-interval '1 day' WHERE sid LIKE 'admin:%'",
    "UPDATE sessions SET sess=jsonb_set(sess::jsonb,'{lastSeen}','0') WHERE sid LIKE 'admin:%'",
  ]) {
    const token = await login();await database.pool.query(update);
    assert.equal((await request('/api/auth?action=user','GET',undefined,token)).status,401);
  }
  const token = await login();const previous = process.env.ADMIN_PASSWORD!;
  process.env.ADMIN_PASSWORD = previous+'changed';
  assert.equal((await request('/api/auth?action=user','GET',undefined,token)).status,401);
  process.env.ADMIN_PASSWORD = previous;
  process.env.SESSION_SECRET += 'changed';
  assert.equal((await request('/api/auth?action=user','GET',undefined,token)).status,401);
});
test('legacy signed tokens and duplicate cookie names are rejected', async () => {
  assert.equal((await request('/api/auth?action=user','GET',undefined,'admin_token='+Buffer.from('0.oldsignature').toString('base64'))).status,401);
  const token = await login();
  assert.equal((await request('/api/auth?action=user','GET',undefined,token+'; '+token)).status,401);
});
test('concurrent login attempts share a durable limit', async () => {
  await database.pool.query("DELETE FROM sessions WHERE sid LIKE 'limit:%'");
  const responses = await Promise.all(Array.from({length:20},() => request('/api/auth','POST',{password:'incorrect'})));
  assert.equal(responses.filter(r=>r.status === 401).length,10);
  assert.equal(responses.filter(r=>r.status === 429).length,10);
  assert(responses.filter(r=>r.status === 429).every(r=>r.headers.has('retry-after')));
});
