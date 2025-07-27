import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Available images in /uploads directory
const AVAILABLE_IMAGES = [
  'bert-diagram.png',
  'compressed-sensing.png', 
  'finance-ml.png',
  'itri-logo.png',
  'itri-logo-updated.png',
  'spx-chart.png',
  'yelp-logo.png'
];

// Image mapping based on project content/category
const IMAGE_MAPPING: { [key: string]: string } = {
  'AI Music Detection': '/uploads/bert-diagram.png', // Deep learning project
  'Machine Learning: Predicting Success of Startups': '/uploads/itri-logo.png',
  'Compressed Sensing': '/uploads/compressed-sensing.png',
  'Financial Risk Management': '/uploads/finance-ml.png',
  'Natural Language Processing': '/uploads/bert-diagram.png', // BERT project
  'Machine Learning: Predicting Spotify Hits': '/uploads/yelp-logo.png', // Entertainment/rating project
  'Recommender Systems: Matrix Factorization': '/uploads/compressed-sensing.png', // Mathematical project
  'Time Series Analysis: SPX': '/uploads/spx-chart.png',
  'Recommender Systems: Collaborative Filtering': '/uploads/yelp-logo.png', // Review-based system
  'Linear Regression: NBA': '/uploads/finance-ml.png' // Analytics project
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
      // Check current image URLs
      const result = await client.query(`
        SELECT id, title, image_url 
        FROM projects 
        ORDER BY sort_order ASC
      `);

      client.release();

      const projects = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        imageUrl: row.image_url,
        exists: AVAILABLE_IMAGES.some(img => row.image_url?.includes(img))
      }));

      return res.json({
        availableImages: AVAILABLE_IMAGES,
        projects,
        summary: {
          total: projects.length,
          withValidImages: projects.filter(p => p.exists).length,
          needingFix: projects.filter(p => !p.exists).length
        }
      });
    }

    if (req.method === 'POST') {
      // Fix image URLs
      console.log('Fixing project image URLs...');

      // Get all projects
      const result = await client.query(`
        SELECT id, title, image_url 
        FROM projects 
        ORDER BY sort_order ASC
      `);

      const updates: Array<{
        id: number;
        title: string;
        oldImageUrl: string;
        newImageUrl: string;
      }> = [];

      for (const row of result.rows) {
        const currentImageUrl = row.image_url;
        const title = row.title;
        
        // Check if current image exists
        const imageExists = AVAILABLE_IMAGES.some(img => currentImageUrl?.includes(img));
        
        if (!imageExists) {
          // Find appropriate image based on title keywords
          let newImageUrl = '/uploads/bert-diagram.png'; // Default fallback
          
          for (const [keyword, imagePath] of Object.entries(IMAGE_MAPPING)) {
            if (title.includes(keyword)) {
              newImageUrl = imagePath;
              break;
            }
          }

          // Update the project
          await client.query(`
            UPDATE projects 
            SET image_url = $1 
            WHERE id = $2
          `, [newImageUrl, row.id]);

          updates.push({
            id: row.id,
            title: title,
            oldImageUrl: currentImageUrl,
            newImageUrl: newImageUrl
          });
        }
      }

      client.release();

      return res.json({
        message: `✅ Fixed ${updates.length} project images!`,
        updates,
        availableImages: AVAILABLE_IMAGES
      });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (error) {
    console.error('Fix Images API Error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 