import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

// CORRECT URL mappings based on actual file names and project titles
const CORRECT_URL_FIXES = [
  { 
    id: 1, 
    title: 'AI Music Detection with Deep Learning',
    projectUrl: '/reports/Team Sound Ethics - Machine Learning AI Music Detection with Deep Learning.pdf' 
  },
  { 
    id: 2, 
    title: 'Machine Learning: Predicting Success of Startups',
    projectUrl: '/reports/ITRI-ML-project-no-time - Machine Learning Predicting Success of Startups.html' 
  },
  { 
    id: 3, 
    title: 'Compressed Sensing and Basis Pursuit',
    projectUrl: '/reports/Compressed-Sensing-and-Basis-Pursuit.html' 
  },
  { 
    id: 4, 
    title: 'Financial Risk Management: Machine Learning Survey',
    projectUrl: '/reports/Evolution of machine learning in financial risk management_A survey.pdf' 
  },
  { 
    id: 5, 
    title: 'Natural Language Processing: Book Review Analysis with BERT',
    projectUrl: '/reports/NLP Final Project Report - Natural Language Processing Book Review Analysis with BERT.pdf' 
  },
  { 
    id: 6, 
    title: 'Machine Learning: Predicting Spotify Hits',
    projectUrl: '/reports/PSTAT-131-Final-Project - Machine Learning Predicting Spotify Hits.html' 
  },
  { 
    id: 7, 
    title: 'Recommender Systems: Matrix Factorization with Deep Learning',
    projectUrl: '/reports/PSTAT-197-Vignette-RS-MF - Recommender Systems with Deep Learning Matrix Factorization.html' 
  },
  { 
    id: 8, 
    title: 'Time Series Analysis: SPX Stock Price Prediction',
    projectUrl: '/reports/PSTAT-174-Final-Project - Time Series SPX Stock Price.html' 
  },
  { 
    id: 9, 
    title: 'Recommender Systems: Collaborative Filtering for Movies',
    projectUrl: '/reports/PSTAT-134-final-project-Group-1 - Recommender Systems with Collaborative Filtering Recommending Movies.html' 
  },
  { 
    id: 10, 
    title: 'Linear Regression: NBA Salary Inference',
    projectUrl: '/reports/NBA_salary_linear_regression - Linear Regression NBA Salary Inference.html' 
  }
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

  console.log('Final Fix Project URLs API: Updating with correct project-report mappings');

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    const results: Array<{ id: number; title?: string; project_url?: string; error?: string }> = [];
    
    for (const fix of CORRECT_URL_FIXES) {
      console.log(`Updating project ${fix.id} (${fix.title}) URL to ${fix.projectUrl}`);
      
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
      message: "Project URLs updated with correct mappings!",
      updated: results.filter(r => !r.error),
      errors: results.filter(r => r.error),
      total: results.length,
      mappings: CORRECT_URL_FIXES
    });
    
  } catch (error) {
    console.error('Final Fix Project URLs API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 