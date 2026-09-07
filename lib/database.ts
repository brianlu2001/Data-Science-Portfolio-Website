import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
export interface DatabaseClient {
  query(text: string, values?: any[]): Promise<{ rows: any[] }>;
  release(): void;
}
export interface DatabasePool {
  connect(): Promise<DatabaseClient>;
  query(text: string, values?: any[]): Promise<{ rows: any[] }>;
}
let database: DatabasePool | undefined;
export function useLocalDatabase(pool: DatabasePool) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Local database forbidden');
  database = pool;
}
export function getPool(): DatabasePool {
  if (!database) {
    if (!process.env.DATABASE_URL) throw new Error('Database unavailable');
    // Neon pooled connections reject startup `options`; database role defaults
    // supply server-side timeouts, with a client-side query timeout as a backstop.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3,
      connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, query_timeout: 10000 });
    pool.on('error', () => console.error('Idle database connection failed'));
    database = pool;
  }
  return database;
}
export async function query(text: string, values: any[] = []) {
  const client = await getPool().connect();
  try { return await client.query(text, values); }
  finally { client.release(); }
}
export async function transaction<T>(run: (client: DatabaseClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
export const camelRow = (row: Record<string, unknown>) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), value]),
);
