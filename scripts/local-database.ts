import { PGlite } from '@electric-sql/pglite';
import type { DatabasePool, DatabaseClient } from '../lib/database.js';
export const localSchema = `
CREATE TABLE IF NOT EXISTS sessions (sid varchar PRIMARY KEY, sess jsonb NOT NULL, expire timestamp NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
CREATE TABLE IF NOT EXISTS projects (
 id serial PRIMARY KEY, title varchar(255) NOT NULL, simplified_description text NOT NULL, full_description text NOT NULL DEFAULT '',
 technologies text[] NOT NULL DEFAULT '{}', category varchar(100), image_url varchar, project_url varchar, github_url varchar,
 status varchar(20) NOT NULL DEFAULT 'finished', sort_order integer NOT NULL DEFAULT 0,
 created_at timestamp DEFAULT NOW(), updated_at timestamp DEFAULT NOW());
CREATE TABLE IF NOT EXISTS site_settings (
 id serial PRIMARY KEY, contact_email varchar,contact_phone varchar,bio text,linkedin_url varchar,logo_urls text[] DEFAULT '{}',updated_at timestamp DEFAULT NOW());
CREATE TABLE IF NOT EXISTS page_views (
 id serial PRIMARY KEY,page varchar(255) NOT NULL,user_agent text,ip_address varchar(45),timestamp timestamp NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS project_clicks (
 id serial PRIMARY KEY,project_id integer REFERENCES projects(id),click_type varchar(50) NOT NULL,
 user_agent text,ip_address varchar(45),timestamp timestamp NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS project_files (
 id serial PRIMARY KEY,project_id integer REFERENCES projects(id),file_name varchar NOT NULL,file_url varchar NOT NULL,
 file_type varchar NOT NULL,created_at timestamp DEFAULT NOW());
`;
export async function localDatabase(directory?: string) {
  const db = new PGlite(directory);
  await db.exec(localSchema);
  // Serialize clients, including whole transactions, like a pool with max=1.
  let tail = Promise.resolve();
  const pool: DatabasePool = {
    async connect() {
      const previous = tail;
      let unlock!: () => void;
      tail = new Promise(resolve => { unlock = resolve; });
      await previous;
      let released = false;
      const client: DatabaseClient = {
        query: async (sql, values) => db.query(sql, values),
        release() { if (!released) { released = true; unlock(); } },
      };
      return client;
    },
    async query(sql, values) {
      const client = await pool.connect();
      try { return await client.query(sql, values); } finally { client.release(); }
    },
  };
  return { db, pool };
}
