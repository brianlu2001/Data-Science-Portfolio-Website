import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

console.log("DATABASE_URL:", process.env.DATABASE_URL);

let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log("Database connection established.");
} catch (err) {
  console.error("Database connection failed:", err);
  throw err;
}

export { pool, db };