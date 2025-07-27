import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Original image URLs from seed data
const ORIGINAL_IMAGE_URLS: { [key: number]: string } = {
  1: '/uploads/bert-diagram.png', // AI Music Detection
  2: '/uploads/itri-logo.png', // Startup Success
  3: '/uploads/compressed-sensing.png', // Compressed Sensing
  4: '/uploads/finance-ml.png', // Financial Risk Management
  5: '/uploads/bert-diagram.png', // NLP BERT
  6: '/uploads/finance-ml.png', // Spotify Hits (was reusing)
  7: '/uploads/compressed-sensing.png', // Matrix Factorization (was reusing)
  8: '/uploads/spx-chart.png', // Time Series SPX
  9: '/uploads/yelp-logo.png', // Movie Recommender (was using yelp as placeholder)
  10: '/uploads/finance-ml.png' // NBA Salary (was reusing)
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Only POST method allowed for restore" });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    console.log('🔄 Restoring original image URLs...');

    const restoredProjects: Array<{
      id: number;
      title: string;
      restoredImageUrl: string;
    }> = [];

    // Get current project titles for logging
    const currentResult = await client.query(`
      SELECT id, title, image_url 
      FROM projects 
      ORDER BY id ASC
    `);

    // Restore each project's original image URL
    for (const [projectId, originalImageUrl] of Object.entries(ORIGINAL_IMAGE_URLS)) {
      const id = parseInt(projectId);
      
      await client.query(`
        UPDATE projects 
        SET image_url = $1 
        WHERE id = $2
      `, [originalImageUrl, id]);

      const project = currentResult.rows.find(row => row.id === id);
      
      restoredProjects.push({
        id: id,
        title: project?.title || `Project ${id}`,
        restoredImageUrl: originalImageUrl
      });

      console.log(`✅ Restored Project ${id}: ${originalImageUrl}`);
    }

    client.release();

    return res.json({
      message: `✅ Successfully restored ${restoredProjects.length} project images to original URLs!`,
      restoredProjects,
      note: "All images have been reset to their original seed data URLs"
    });

  } catch (error) {
    console.error('Restore Images API Error:', error);
    return res.status(500).json({
      message: "Internal server error during restore",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 