import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Available PNG files in /uploads directory
const AVAILABLE_PNG_FILES = [
  'bert-diagram.png',
  'compressed-sensing.png', 
  'finance-ml.png',
  'itri-logo.png',
  'itri-logo-updated.png',
  'spx-chart.png',
  'yelp-logo.png'
];

// Smart mapping for PNG files based on project content
const PNG_MAPPING: { [key: string]: string } = {
  'AI Music Detection': '/uploads/bert-diagram.png', // Deep learning/AI
  'Machine Learning: Predicting Success of Startups': '/uploads/itri-logo.png', // ITRI project
  'Compressed Sensing': '/uploads/compressed-sensing.png', // Direct match
  'Financial Risk Management': '/uploads/finance-ml.png', // Finance ML
  'Natural Language Processing': '/uploads/bert-diagram.png', // BERT/NLP
  'BERT': '/uploads/bert-diagram.png', // BERT projects
  'Machine Learning: Predicting Spotify': '/uploads/yelp-logo.png', // Entertainment/reviews
  'Recommender Systems: Matrix Factorization': '/uploads/compressed-sensing.png', // Mathematical
  'Time Series Analysis: SPX': '/uploads/spx-chart.png', // Stock/SPX chart
  'Recommender Systems: Collaborative': '/uploads/yelp-logo.png', // Review-based
  'Linear Regression: NBA': '/uploads/finance-ml.png' // Analytics/stats
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
      // Check current state - separate URLs from PNG files
      const result = await client.query(`
        SELECT id, title, image_url, sort_order
        FROM projects 
        ORDER BY sort_order ASC
      `);

      client.release();

      const projects = result.rows.map(row => {
        const imageUrl = row.image_url || '';
        const isUrl = imageUrl.startsWith('http') || imageUrl.includes('://');
        const isPng = imageUrl.includes('.png');
        const isWorkingPng = isPng && AVAILABLE_PNG_FILES.some(file => imageUrl.includes(file));
        
        return {
          id: row.id,
          title: row.title,
          imageUrl: imageUrl,
          sortOrder: row.sort_order,
          type: isUrl ? 'URL' : (isPng ? 'PNG' : 'OTHER'),
          status: isUrl ? 'WORKING' : (isWorkingPng ? 'WORKING_PNG' : 'BROKEN_PNG')
        };
      });

      return res.json({
        message: "Current image analysis",
        projects,
        summary: {
          total: projects.length,
          workingUrls: projects.filter(p => p.status === 'WORKING').length,
          workingPngs: projects.filter(p => p.status === 'WORKING_PNG').length,
          brokenPngs: projects.filter(p => p.status === 'BROKEN_PNG').length
        },
        availablePngFiles: AVAILABLE_PNG_FILES.map(file => `/uploads/${file}`)
      });
    }

    if (req.method === 'POST') {
      // Fix ONLY broken PNG paths, preserve working URLs
      console.log('🔧 Fixing only broken PNG paths, preserving working URLs...');

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
        reason: string;
      }> = [];

      for (const row of result.rows) {
        const currentImageUrl = row.image_url || '';
        const title = row.title;
        
        // Skip if it's a working URL (http/https)
        if (currentImageUrl.startsWith('http') || currentImageUrl.includes('://')) {
          console.log(`⏭️ Skipping URL-based image for "${title}": ${currentImageUrl}`);
          continue;
        }
        
        // Skip if it's already a working PNG
        if (currentImageUrl.includes('.png') && AVAILABLE_PNG_FILES.some(file => currentImageUrl.includes(file))) {
          console.log(`✅ PNG already working for "${title}": ${currentImageUrl}`);
          continue;
        }
        
        // This needs fixing - find appropriate PNG
        let newImageUrl = '/uploads/bert-diagram.png'; // Default fallback
        let reason = 'Default fallback';
        
        for (const [keyword, imagePath] of Object.entries(PNG_MAPPING)) {
          if (title.includes(keyword)) {
            newImageUrl = imagePath;
            reason = `Matched keyword: ${keyword}`;
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
          newImageUrl: newImageUrl,
          reason: reason
        });

        console.log(`🔄 Fixed "${title}": ${currentImageUrl} → ${newImageUrl}`);
      }

      client.release();

      return res.json({
        message: `✅ Fixed ${updates.length} broken PNG paths while preserving working URLs!`,
        updates,
        note: "URL-based images were left unchanged, only broken PNG paths were fixed"
      });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (error) {
    console.error('PNG Fix API Error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 