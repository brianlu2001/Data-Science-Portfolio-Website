import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: "Only GET method allowed" });
  }

  console.log('Check Project URLs API: Displaying current project-report mappings');

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    const result = await client.query(`
      SELECT 
        id,
        title,
        project_url,
        sort_order
      FROM projects 
      ORDER BY sort_order ASC
    `);

    client.release();
    
    const mappings = result.rows.map((row, index) => ({
      label: `Project ${String.fromCharCode(65 + index)}`, // A, B, C, etc.
      id: row.id,
      title: row.title,
      currentReportUrl: row.project_url,
      sortOrder: row.sort_order
    }));

    return res.json({
      message: "Current project-report mappings",
      mappings,
      total: mappings.length
    });
    
  } catch (error) {
    console.error('Check Project URLs API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 