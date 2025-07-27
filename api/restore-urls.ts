import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Based on the attached_assets files I saw, these are likely the original working URLs
// I need to map them back to the projects that had URL-based images before
const RESTORE_TO_ORIGINAL_URLS: { [key: number]: string } = {
  // These are the projects that likely had working URL-based images
  // I'll restore them to likely working URLs from attached_assets or keep PNGs for others
  1: '/uploads/bert-diagram.png', // AI Music Detection - keep PNG
  2: '/uploads/itri-logo.png', // Startup Success - keep PNG  
  3: '/uploads/compressed-sensing.png', // Compressed Sensing - keep PNG
  4: '/uploads/finance-ml.png', // Financial Risk Management - keep PNG
  5: '/uploads/bert-diagram.png', // NLP BERT - keep PNG
  6: 'https://example.com/spotify-image.jpg', // Spotify - this might have been a URL
  7: 'https://example.com/matrix-factorization.jpg', // Matrix Fact - might have been URL
  8: '/uploads/spx-chart.png', // SPX - keep PNG
  9: 'https://example.com/movie-recommender.jpg', // Movie Recommender - might have been URL
  10: 'https://example.com/nba-salary.jpg' // NBA Salary - might have been URL
};

// EXACT original mapping from server/seedData.ts - these were the working URLs
const ORIGINAL_SEED_MAPPING: { [key: number]: { url: string; type: 'png' } } = {
  1: { url: '/uploads/bert-diagram.png', type: 'png' }, // AI Music Detection
  2: { url: '/uploads/itri-logo.png', type: 'png' }, // Startup Success
  3: { url: '/uploads/compressed-sensing.png', type: 'png' }, // Compressed Sensing
  4: { url: '/uploads/finance-ml.png', type: 'png' }, // Financial Risk Management
  5: { url: '/uploads/bert-diagram.png', type: 'png' }, // NLP BERT
  6: { url: '/uploads/finance-ml.png', type: 'png' }, // Spotify Hits (was reusing)
  7: { url: '/uploads/compressed-sensing.png', type: 'png' }, // Matrix Factorization (was reusing)
  8: { url: '/uploads/spx-chart.png', type: 'png' }, // SPX Time Series
  9: { url: '/uploads/yelp-logo.png', type: 'png' }, // Movie Recommender (using yelp as placeholder)
  10: { url: '/uploads/finance-ml.png', type: 'png' } // NBA Salary (was reusing)
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    if (req.method === 'GET') {
      // Show current state and what we plan to restore
      const result = await client.query(`
        SELECT id, title, image_url
        FROM projects 
        ORDER BY sort_order ASC
      `);

      client.release();

      const restorePlan = result.rows.map(row => {
        const planned = ORIGINAL_SEED_MAPPING[row.id];
        return {
          id: row.id,
          title: row.title,
          currentImageUrl: row.image_url,
          plannedImageUrl: planned?.url || 'NO PLAN',
          plannedType: planned?.type || 'unknown',
          willChange: row.image_url !== planned?.url
        };
      });

      return res.json({
        message: "Restore plan - EXACT original seed data mapping (all were PNG files)",
        restorePlan,
        note: "These are the exact imageUrl paths from server/seedData.ts before any changes"
      });
    }

    if (req.method === 'POST') {
      // Apply the restore plan
      console.log('🔄 Restoring mixed URL/PNG images...');

      const updates: Array<{
        id: number;
        title: string;
        oldImageUrl: string;
        newImageUrl: string;
        type: string;
      }> = [];

      // Get current project titles
      const currentResult = await client.query(`
        SELECT id, title, image_url 
        FROM projects 
        ORDER BY id ASC
      `);

      for (const [projectId, config] of Object.entries(ORIGINAL_SEED_MAPPING)) {
        const id = parseInt(projectId);
        const project = currentResult.rows.find(row => row.id === id);
        
        if (project && project.image_url !== config.url) {
          await client.query(`
            UPDATE projects 
            SET image_url = $1 
            WHERE id = $2
          `, [config.url, id]);

          updates.push({
            id: id,
            title: project.title,
            oldImageUrl: project.image_url,
            newImageUrl: config.url,
            type: config.type
          });

          console.log(`✅ Restored Project ${id}: ${config.url} (${config.type})`);
        }
      }

      client.release();

      return res.json({
        message: `✅ Restored ${updates.length} project images to EXACT original seed data paths!`,
        updates,
        note: "All images restored to the exact paths from server/seedData.ts"
      });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (error) {
    console.error('Restore URLs API Error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 