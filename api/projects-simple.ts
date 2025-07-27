import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Function to properly encode URLs while preserving the path structure
function sanitizeProjectUrl(url: string): string {
  if (!url) return url;
  
  // Check if URL is already encoded by looking for % characters
  if (url.includes('%')) {
    console.log('URL appears already encoded, returning as-is:', url);
    return url;
  }
  
  // Split URL into parts
  const urlParts = url.split('/');
  
  // URL encode only the filename (last part)
  const filename = urlParts[urlParts.length - 1];
  const encodedFilename = encodeURIComponent(filename);
  
  // Reconstruct the URL
  urlParts[urlParts.length - 1] = encodedFilename;
  
  const result = urlParts.join('/');
  console.log('URL sanitization:', url, '→', result);
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`Simple Projects API: ${req.method} /api/projects-simple`);

  if (req.method === 'GET') {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT id, title, simplified_description, full_description, 
                 technologies, category, image_url, project_url, github_url, 
                 sort_order, created_at, updated_at
          FROM projects 
          ORDER BY sort_order ASC
        `);
        
        const projects = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          simplifiedDescription: row.simplified_description,
          fullDescription: row.full_description,
          technologies: row.technologies,
          category: row.category,
          imageUrl: row.image_url,
          projectUrl: row.project_url,
          githubUrl: row.github_url,
          sortOrder: row.sort_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        console.log(`Fetched ${projects.length} projects`);
        return res.json(projects);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch projects',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      // Handle both JSON and FormData
      let data;
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Handle FormData (from admin dashboard)
        const formData = req.body;
        data = {
          title: formData.title,
          simplifiedDescription: formData.simplifiedDescription,
          fullDescription: formData.fullDescription,
          technologies: formData.technologies ? 
            (Array.isArray(formData.technologies) ? formData.technologies : formData.technologies.split(',').map((t: string) => t.trim())) : 
            [],
          category: formData.category,
          imageUrl: formData.imageUrl,
          projectUrl: formData.projectUrl,
          githubUrl: formData.githubUrl
        };
      } else {
        // Handle JSON
        data = req.body;
      }

      const {
        title,
        simplifiedDescription,
        fullDescription,
        technologies,
        category,
        imageUrl,
        projectUrl,
        githubUrl
      } = data;

      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const client = await pool.connect();
      try {
        // Start transaction
        await client.query('BEGIN');

        // Push all existing projects down by 1
        await client.query('UPDATE projects SET sort_order = sort_order + 1');

        // Sanitize URLs before inserting
        const sanitizedProjectUrl = sanitizeProjectUrl(projectUrl);
        const sanitizedGithubUrl = sanitizeProjectUrl(githubUrl);

        // Insert new project at position 1
        const result = await client.query(`
          INSERT INTO projects (
            title, simplified_description, full_description, 
            technologies, category, image_url, project_url, github_url, 
            sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, NOW(), NOW())
          RETURNING *
        `, [
          title,
          simplifiedDescription,
          fullDescription,
          technologies,
          category,
          imageUrl,
          sanitizedProjectUrl,
          sanitizedGithubUrl
        ]);

        await client.query('COMMIT');

        const newProject = result.rows[0];
        const project = {
          id: newProject.id,
          title: newProject.title,
          simplifiedDescription: newProject.simplified_description,
          fullDescription: newProject.full_description,
          technologies: newProject.technologies,
          category: newProject.category,
          imageUrl: newProject.image_url,
          projectUrl: newProject.project_url,
          githubUrl: newProject.github_url,
          sortOrder: newProject.sort_order,
          createdAt: newProject.created_at,
          updatedAt: newProject.updated_at
        };

        console.log('Created new project:', project.title);
        return res.status(201).json(project);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Project creation error:', error);
      return res.status(500).json({
        message: 'Failed to create project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 