import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    const result = await client.query(`
      SELECT id, title, project_url, sort_order
      FROM projects 
      ORDER BY sort_order ASC
    `);

    client.release();
    
    return res.json({
      currentMappings: result.rows.map((row, index) => ({
        label: `Project ${String.fromCharCode(65 + index)}`,
        id: row.id,
        title: row.title,
        currentUrl: row.project_url
      }))
    });
    
  } catch (error) {
    return res.status(500).json({ 
      message: "Error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 