import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('DB Test endpoint hit!');

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "DATABASE_URL not configured" });
    }

    console.log('Creating pool...');
    const pool = new Pool({ connectionString: databaseUrl });
    
    console.log('Testing basic connectivity...');
    const client = await pool.connect();
    
    console.log('Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Time query result:', result.rows[0]);
    
    console.log('Testing projects table existence...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'projects'
    `);
    console.log('Projects table exists:', tableCheck.rows.length > 0);
    
    if (tableCheck.rows.length > 0) {
      console.log('Testing projects count...');
      const countResult = await client.query('SELECT COUNT(*) as count FROM projects');
      console.log('Projects count:', countResult.rows[0]);
      
      console.log('Testing projects sample...');
      const sampleResult = await client.query('SELECT id, title, sort_order FROM projects LIMIT 3');
      console.log('Sample projects:', sampleResult.rows);
    }
    
    client.release();
    
    return res.json({ 
      message: 'Database test successful!',
      currentTime: result.rows[0],
      projectsTableExists: tableCheck.rows.length > 0,
      projectsCount: tableCheck.rows.length > 0 ? (await client.query('SELECT COUNT(*) as count FROM projects')).rows[0] : null
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({ 
      message: "Database test failed", 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 