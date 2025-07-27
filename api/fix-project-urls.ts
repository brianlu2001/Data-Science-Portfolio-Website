import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

// URL mappings to fix the database
const URL_FIXES = [
  { id: 1, projectUrl: '/reports/ai-music-detection.pdf' },
  { id: 2, projectUrl: '/reports/startup-success-prediction.html' },
  { id: 3, projectUrl: '/reports/compressed-sensing-basis-pursuit.html' },
  { id: 4, projectUrl: '/reports/financial-ml-survey.pdf' },
  { id: 5, projectUrl: '/reports/nlp-bert-book-reviews.pdf' },
  { id: 6, projectUrl: '/reports/spotify-hits-prediction.html' },
  { id: 7, projectUrl: '/reports/deep-learning-matrix-factorization.html' },
  { id: 8, projectUrl: '/reports/spx-stock-prediction.html' },
  { id: 9, projectUrl: '/reports/movie-recommender-collaborative-filtering.html' },
  { id: 10, projectUrl: '/reports/nba-salary-regression.html' }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Only POST method allowed" });
  }

  console.log('Fix Project URLs API: Updating project URLs to match available files');

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    const results: Array<{ id: number; title?: string; project_url?: string; error?: string }> = [];
    
    for (const fix of URL_FIXES) {
      console.log(`Updating project ${fix.id} URL to ${fix.projectUrl}`);
      
      const result = await client.query(`
        UPDATE projects 
        SET project_url = $1 
        WHERE id = $2
        RETURNING id, title, project_url
      `, [fix.projectUrl, fix.id]);
      
      if (result.rows.length > 0) {
        results.push(result.rows[0]);
        console.log(`✅ Updated project ${fix.id}: ${result.rows[0].title}`);
      } else {
        console.log(`❌ Project ${fix.id} not found`);
        results.push({ id: fix.id, error: 'Not found' });
      }
    }

    client.release();
    
    return res.json({
      message: "Project URLs updated successfully",
      updated: results.filter(r => !r.error),
      errors: results.filter(r => r.error),
      total: results.length
    });
    
  } catch (error) {
    console.error('Fix Project URLs API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 