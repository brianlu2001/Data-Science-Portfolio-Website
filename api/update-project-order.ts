import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { requireAuth } from './_authHelper';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Only PUT method allowed' });
  }

  if (!requireAuth(req, res)) return;

  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ message: 'Projects array is required' });
    }

    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Update each project's sort_order
      for (const project of projects) {
        await client.query(
          'UPDATE projects SET sort_order = $1, updated_at = NOW() WHERE id = $2',
          [project.sortOrder, project.id]
        );
      }

      // Commit transaction
      await client.query('COMMIT');

      console.log(`Updated sort order for ${projects.length} projects`);

      return res.json({
        success: true,
        message: `Updated sort order for ${projects.length} projects`,
        updatedCount: projects.length
      });

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Project order update error:', error);
    return res.status(500).json({
      message: 'Failed to update project order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 