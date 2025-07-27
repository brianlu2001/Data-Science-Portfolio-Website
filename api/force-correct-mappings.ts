import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

// CORRECT mappings based on actual current database titles
const FORCE_CORRECT_MAPPINGS = [
  {
    id: 1,
    title: "AI Music Detection with Deep Learning",
    correctUrl: "/reports/Team%20Sound%20Ethics%20-%20Machine%20Learning%20AI%20Music%20Detection%20with%20Deep%20Learning.pdf"
  },
  {
    id: 2,
    title: "Predicting Success of Startups", 
    correctUrl: "/reports/ITRI-ML-project-no-time%20-%20Machine%20Learning%20Predicting%20Success%20of%20Startups.html"
  },
  {
    id: 3,
    title: "Book Review Analysis with BERT",
    correctUrl: "/reports/NLP%20Final%20Project%20Report%20-%20Natural%20Language%20Processing%20Book%20Review%20Analysis%20with%20BERT.pdf"
  },
  {
    id: 4,
    title: "Evolution of Machine Learning in Financial Risk Management",
    correctUrl: "/reports/Evolution%20of%20machine%20learning%20in%20financial%20risk%20management_A%20survey.pdf"
  },
  {
    id: 5,
    title: "Compressed Sensing and Basis Pursuit",
    correctUrl: "/reports/Compressed-Sensing-and-Basis-Pursuit.html"
  },
  {
    id: 6,
    title: "Recommending Amazon Product with Matrix Factorization",
    correctUrl: "/reports/PSTAT-197-Vignette-RS-MF%20-%20Recommender%20Systems%20with%20Deep%20Learning%20Matrix%20Factorization.html"
  },
  {
    id: 7,
    title: "Recommending Restaurants with Collaborative Filtering", 
    correctUrl: "/reports/PSTAT-134-final-project-Group-1%20-%20Recommender%20Systems%20with%20Collaborative%20Filtering%20Recommending%20Movies.html"
  },
  {
    id: 8,
    title: "Predicting Spotify Hits",
    correctUrl: "/reports/PSTAT-131-Final-Project%20-%20Machine%20Learning%20Predicting%20Spotify%20Hits.html"
  },
  {
    id: 9,
    title: "Time Series SPX Stock Price",
    correctUrl: "/reports/PSTAT-174-Final-Project%20-%20Time%20Series%20SPX%20Stock%20Price.html"
  },
  {
    id: 10,
    title: "NBA Salary Inference",
    correctUrl: "/reports/NBA_salary_linear_regression%20-%20Linear%20Regression%20NBA%20Salary%20Inference.html"
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Only POST method allowed" });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    const results: Array<{ id: number; title?: string; project_url?: string; error?: string }> = [];
    
    for (const mapping of FORCE_CORRECT_MAPPINGS) {
      console.log(`Forcing correct mapping for ID ${mapping.id}: ${mapping.title} → ${mapping.correctUrl}`);
      
      const result = await client.query(`
        UPDATE projects 
        SET project_url = $1 
        WHERE id = $2
        RETURNING id, title, project_url
      `, [mapping.correctUrl, mapping.id]);
      
      if (result.rows.length > 0) {
        results.push(result.rows[0]);
        console.log(`✅ Fixed project ${mapping.id}: ${result.rows[0].title}`);
      } else {
        console.log(`❌ Project ${mapping.id} not found`);
        results.push({ id: mapping.id, error: 'Not found' });
      }
    }

    client.release();
    
    return res.json({
      message: "FORCED correct project-report mappings!",
      updated: results.filter(r => !r.error),
      errors: results.filter(r => r.error),
      total: results.length
    });
    
  } catch (error) {
    console.error('Force Correct Mappings API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 