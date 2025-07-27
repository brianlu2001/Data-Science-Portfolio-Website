import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Function to properly encode URLs while preserving the path structure
function sanitizeProjectUrl(url: string): string {
  if (!url) return url;
  
  // Split URL into parts
  const urlParts = url.split('/');
  
  // URL encode only the filename (last part)
  const filename = urlParts[urlParts.length - 1];
  const encodedFilename = encodeURIComponent(filename);
  
  // Reconstruct the URL
  urlParts[urlParts.length - 1] = encodedFilename;
  
  return urlParts.join('/');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const projectId = parseInt(id as string);

  if (isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  if (req.method === 'GET') {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT id, title, simplified_description, full_description, 
                 technologies, category, image_url, project_url, github_url, 
                 sort_order, created_at, updated_at
          FROM projects 
          WHERE id = $1
        `, [projectId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }

        const row = result.rows[0];
        const project = {
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
        };

        return res.json(project);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      return res.status(500).json({
        message: 'Failed to fetch project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Handle both JSON and FormData
      let data;
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Handle FormData (from admin dashboard)
        console.log('Processing FormData for project update');
        const formData = req.body;
        data = {
          title: formData.title,
          simplifiedDescription: formData.simplifiedDescription,
          fullDescription: formData.fullDescription,
          technologies: formData.technologies ? 
            (Array.isArray(formData.technologies) ? formData.technologies : 
             typeof formData.technologies === 'string' ? JSON.parse(formData.technologies) : formData.technologies) : 
            [],
          category: formData.category,
          imageUrl: formData.imageUrl,
          projectUrl: formData.projectUrl,
          githubUrl: formData.githubUrl,
          sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : 0
        };
      } else {
        // Handle JSON
        data = req.body;
      }

      console.log('Project update data:', data);

      const {
        title,
        simplifiedDescription,
        fullDescription,
        technologies,
        category,
        imageUrl,
        projectUrl,
        githubUrl,
        sortOrder
      } = data;

      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }

      // Sanitize URLs before updating
      const sanitizedProjectUrl = sanitizeProjectUrl(projectUrl);
      const sanitizedGithubUrl = sanitizeProjectUrl(githubUrl);

      const client = await pool.connect();
      try {
        const result = await client.query(`
          UPDATE projects SET
            title = $1,
            simplified_description = $2,
            full_description = $3,
            technologies = $4,
            category = $5,
            image_url = $6,
            project_url = $7,
            github_url = $8,
            sort_order = $9,
            updated_at = NOW()
          WHERE id = $10
          RETURNING *
        `, [
          title,
          simplifiedDescription,
          fullDescription,
          technologies,
          category,
          imageUrl,
          sanitizedProjectUrl,
          sanitizedGithubUrl,
          sortOrder,
          projectId
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }

        const row = result.rows[0];
        const project = {
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
        };

        console.log(`Updated project ${projectId}: ${title}`);
        if (projectUrl !== sanitizedProjectUrl) {
          console.log(`  Sanitized project URL: "${projectUrl}" → "${sanitizedProjectUrl}"`);
        }
        if (githubUrl !== sanitizedGithubUrl) {
          console.log(`  Sanitized GitHub URL: "${githubUrl}" → "${sanitizedGithubUrl}"`);
        }

        return res.json(project);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({
        message: 'Failed to update project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('DELETE FROM projects WHERE id = $1 RETURNING *', [projectId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }

        console.log(`Deleted project ${projectId}`);
        return res.json({ success: true, message: 'Project deleted successfully' });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      return res.status(500).json({
        message: 'Failed to delete project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 