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

// EXACT original mapping from replit_dump.sql - these were the ACTUAL working URLs
const ORIGINAL_DATABASE_MAPPING: { [key: number]: { url: string; type: 'url' | 'png' } } = {
  1: { url: 'https://cdn.prod.website-files.com/66715118c4748bd61331f714/669796103c8f35e453e0fd8a_sound-ethics-share.jpg', type: 'url' }, // AI Music Detection
  2: { url: '/uploads/itri-logo-updated.png', type: 'png' }, // Startup Success
  3: { url: '/uploads/bert-diagram.png', type: 'png' }, // Book Review Analysis with BERT
  4: { url: '/uploads/finance-ml.png', type: 'png' }, // Financial Risk Management
  5: { url: '/uploads/compressed-sensing.png', type: 'png' }, // Compressed Sensing
  6: { url: 'https://koto.studio/wp-content/uploads/2025/04/Amazon_CS_01_Intro_00_Thumbnail.jpg', type: 'url' }, // Amazon Matrix Factorization
  7: { url: '/uploads/yelp-logo.png', type: 'png' }, // Restaurant Collaborative Filtering
  8: { url: 'https://img.4gamers.com.tw/puku-clone-version/53cb4dbc919ccb10d6cc5cf98b5395b9b5091521.jpg', type: 'url' }, // Spotify Hits
  9: { url: '/uploads/spx-chart.png', type: 'png' }, // Time Series SPX
  10: { url: 'https://sportshub.cbsistatic.com/i/r/2024/08/10/a0110e0e-543f-4df4-bf1a-660be328433b/thumbnail/1200x675/ef4ff686397ab81936a840388045033d/lebron-kd-steph-usa-medal-getty.png', type: 'url' } // NBA Salary
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
        const planned = ORIGINAL_DATABASE_MAPPING[row.id];
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
        message: "Restore plan - EXACT original database mapping (mix of URLs and PNG files)",
        restorePlan,
        note: "These are the exact imageUrl paths from replit_dump.sql - the ACTUAL working configuration"
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

      for (const [projectId, config] of Object.entries(ORIGINAL_DATABASE_MAPPING)) {
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
        message: `✅ Restored ${updates.length} project images to EXACT original database paths!`,
        updates,
        note: "All images restored to the exact paths from replit_dump.sql (mix of URLs and PNG files)"
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