import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

const CORRECT_BIO = "Welcome to Kuan-I (Brian) Lu's Data Science Portfolio! Here, you'll find a collection of projects that highlight my journey through the diverse world of data science. From machine learning and time series analysis to signal processing, linear regression, and hands-on data cleaning, these projects span a wide range of disciplines and challenges. Take a look around—hope you enjoy exploring as much as I enjoyed building them!";

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

    console.log('Seeding/updating site settings with bio...');
    
    // Upsert site settings with bio
    const result = await client.query(`
      INSERT INTO site_settings (
        id, 
        contact_email, 
        contact_phone, 
        bio, 
        linkedin_url, 
        updated_at
      ) VALUES (
        1,
        'brian901231@gmail.com',
        '8056897961',
        $1,
        'https://www.linkedin.com/in/kuan-i-lu/',
        NOW()
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        bio = $1,
        updated_at = NOW()
      RETURNING *
    `, [CORRECT_BIO]);

    client.release();
    
    return res.json({
      message: "✅ Bio successfully seeded/updated!",
      siteSettings: {
        bio: result.rows[0].bio,
        contactEmail: result.rows[0].contact_email,
        contactPhone: result.rows[0].contact_phone,
        linkedinUrl: result.rows[0].linkedin_url
      }
    });
    
  } catch (error) {
    console.error('Seed Bio API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 