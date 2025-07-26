import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { siteSettings } from '../shared/schema';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Database connection
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);

    if (req.method === 'GET') {
      console.log('Fetching site settings...');
      const [settings] = await db.select().from(siteSettings).limit(1);
      console.log('Site settings found:', !!settings);
      return res.json(settings || {});
    }
    
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}