// Explicit, read-only production export. The normal local server never connects remotely.
// Run: node --env-file=.env.local scripts/snapshot-analytics.mjs
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs/promises';
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const client = await pool.connect();
try {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const views = await client.query('SELECT id,page,timestamp FROM page_views ORDER BY id');
  const clicks = await client.query('SELECT id,project_id,click_type,timestamp FROM project_clicks ORDER BY id');
  await client.query('COMMIT');
  await fs.mkdir('.local', { recursive: true });
  await fs.writeFile('.local/analytics-snapshot.json', JSON.stringify({ exportedAt: new Date().toISOString(), views: views.rows, clicks: clicks.rows }));
  console.log(JSON.stringify({ pageViews: views.rows.length, projectClicks: clicks.rows.length,
    earliestView: views.rows[0]?.timestamp, latestView: views.rows.at(-1)?.timestamp }));
} finally { client.release(); await pool.end(); }
