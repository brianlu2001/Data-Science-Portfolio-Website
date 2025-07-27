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
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Show current project URLs for inspection
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT id, title, project_url
          FROM projects 
          WHERE project_url IS NOT NULL AND project_url != ''
          ORDER BY sort_order ASC
        `);

        const projects = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          currentUrl: row.project_url,
          proposedUrl: sanitizeProjectUrl(row.project_url),
          needsUpdate: row.project_url !== sanitizeProjectUrl(row.project_url)
        }));

        return res.json({
          message: 'Current project URLs analysis',
          projects,
          totalNeedingUpdate: projects.filter(p => p.needsUpdate).length
        });

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error analyzing project URLs:', error);
      return res.status(500).json({
        message: 'Failed to analyze project URLs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const client = await pool.connect();
      let updatedCount = 0;
      
      try {
        // Get all projects with URLs
        const result = await client.query(`
          SELECT id, title, project_url
          FROM projects 
          WHERE project_url IS NOT NULL AND project_url != ''
        `);

        console.log(`Found ${result.rows.length} projects with URLs`);

        // Update each project URL that needs sanitization
        for (const row of result.rows) {
          const originalUrl = row.project_url;
          const sanitizedUrl = sanitizeProjectUrl(originalUrl);
          
          if (originalUrl !== sanitizedUrl) {
            await client.query(
              'UPDATE projects SET project_url = $1, updated_at = NOW() WHERE id = $2',
              [sanitizedUrl, row.id]
            );
            
            console.log(`Updated project ${row.id}: "${originalUrl}" → "${sanitizedUrl}"`);
            updatedCount++;
          }
        }

        return res.json({
          success: true,
          message: `Successfully sanitized ${updatedCount} project URLs`,
          updatedCount,
          totalProjects: result.rows.length
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Project URL sanitization error:', error);
      return res.status(500).json({
        message: 'Failed to sanitize project URLs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 