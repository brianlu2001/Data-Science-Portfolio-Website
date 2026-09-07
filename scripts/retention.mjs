// Authorized maintenance command: permanently removes analytics older than 366 days.
import { Pool } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query("DELETE FROM page_views WHERE timestamp < NOW() - interval '366 days'");
  await pool.query("DELETE FROM project_clicks WHERE timestamp < NOW() - interval '366 days'");
  await pool.query("UPDATE page_views SET ip_address=NULL,user_agent=NULL WHERE ip_address IS NOT NULL OR user_agent IS NOT NULL");
  await pool.query("UPDATE project_clicks SET ip_address=NULL,user_agent=NULL WHERE ip_address IS NOT NULL OR user_agent IS NOT NULL");
  await pool.query("DELETE FROM sessions WHERE expire < NOW()");
  console.log('Retention maintenance complete');
} finally { await pool.end(); }
