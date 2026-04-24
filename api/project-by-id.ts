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

  console.log(`Project By ID API: ${req.method} /api/project-by-id`);
  console.log('Query params:', req.query);

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    // Get project ID from query parameter
    const { id } = req.query;
    const projectId = parseInt(id as string);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    console.log(`Fetching project ${projectId}...`);
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT
          id, title, simplified_description, full_description,
          technologies, category, image_url, project_url, github_url,
          status, sort_order, created_at, updated_at
        FROM projects
        WHERE id = $1
      `, [projectId]);

      if (result.rows.length === 0) {
        client.release();
        return res.status(404).json({ message: "Project not found" });
      }

      const row = result.rows[0];
      const project = {
        id: row.id,
        title: row.title,
        simplifiedDescription: row.simplified_description,
        fullDescription: row.full_description,
        technologies: row.technologies || [],
        category: row.category,
        imageUrl: row.image_url,
        projectUrl: row.project_url,
        githubUrl: row.github_url,
        status: row.status || 'finished',
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      client.release();
      console.log(`Found project: ${project.title}`);
      return res.json(project);
    }
    
    client.release();
    return res.status(405).json({ message: "Method not allowed" });
    
  } catch (error) {
    console.error('Project By ID API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
} 