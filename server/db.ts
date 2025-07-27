import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

let pool: Pool;

try {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log("Database connection pool established.");
} catch (err) {
  console.error("Database connection failed:", err);
  throw err;
}

export { pool };