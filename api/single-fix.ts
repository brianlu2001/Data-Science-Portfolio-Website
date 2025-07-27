import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Only POST method allowed" });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    // Fix Project 6 (Matrix Factorization) to point to PDF instead of HTML
    const newUrl = '/reports/Recommender%20Systems%20with%20Deep%20Learning%20-%20Matrix%20Factorization.pdf';
    
    console.log(`Updating Project 6 to PDF: ${newUrl}`);
    
    const result = await client.query(`
      UPDATE projects 
      SET project_url = $1 
      WHERE id = 6
      RETURNING id, title, project_url
    `, [newUrl]);

    client.release();
    
    if (result.rows.length > 0) {
      return res.json({
        message: "✅ Updated Matrix Factorization project to PDF!",
        updated: result.rows[0]
      });
    } else {
      return res.json({
        message: "❌ Project 6 not found"
      });
    }
    
  } catch (error) {
    console.error('Single Fix API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 