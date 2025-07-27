import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: "Only GET method allowed" });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    // Get all current project image URLs
    const result = await client.query(`
      SELECT 
        id, 
        title, 
        image_url,
        sort_order
      FROM projects 
      ORDER BY sort_order ASC
    `);

    client.release();

    const projects = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      sortOrder: row.sort_order
    }));

    return res.json({
      message: "Current database image URLs",
      totalProjects: projects.length,
      projects,
      availableInUploads: [
        '/uploads/bert-diagram.png',
        '/uploads/compressed-sensing.png', 
        '/uploads/finance-ml.png',
        '/uploads/itri-logo.png',
        '/uploads/itri-logo-updated.png',
        '/uploads/spx-chart.png',
        '/uploads/yelp-logo.png'
      ],
      note: "Check which imageUrl paths are actually working on your site and tell me which ones to restore"
    });

  } catch (error) {
    console.error('Check Images API Error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 