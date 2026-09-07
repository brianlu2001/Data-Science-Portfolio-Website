// Remove visitor identifiers while preserving historical event counts.
import { Pool } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query("UPDATE page_views SET ip_address=NULL,user_agent=NULL WHERE ip_address IS NOT NULL OR user_agent IS NOT NULL");
  await pool.query("UPDATE project_clicks SET ip_address=NULL,user_agent=NULL WHERE ip_address IS NOT NULL OR user_agent IS NOT NULL");
  await pool.query("DELETE FROM sessions WHERE expire < NOW()");
  console.log('Retention maintenance complete');
} finally { await pool.end(); }
