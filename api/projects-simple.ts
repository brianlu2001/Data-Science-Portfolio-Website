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

  console.log(`Simple Projects API: ${req.method} /api/projects-simple`);

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    console.log('Creating database connection...');
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    if (req.method === 'GET') {
      console.log('Fetching projects with raw SQL...');
      
      const result = await client.query(`
        SELECT 
          id,
          title,
          simplified_description,
          full_description,
          technologies,
          category,
          image_url,
          project_url,
          github_url,
          sort_order,
          created_at,
          updated_at
        FROM projects 
        ORDER BY sort_order ASC
      `);
      
      console.log(`Found ${result.rows.length} projects`);
      
      // Transform to match expected format
      const projects = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        simplifiedDescription: row.simplified_description,
        fullDescription: row.full_description,
        technologies: row.technologies || [],
        category: row.category,
        imageUrl: row.image_url,
        projectUrl: row.project_url,
        githubUrl: row.github_url,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      client.release();
      console.log('Sample project:', projects[0] ? { id: projects[0].id, title: projects[0].title } : 'none');
      return res.json(projects);
    }
    
    client.release();
    return res.status(405).json({ message: "Method not allowed" });
    
  } catch (error) {
    console.error('Projects API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
} 