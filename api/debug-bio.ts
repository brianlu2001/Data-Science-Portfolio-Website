import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

    // Check if site_settings table exists and what data it contains
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'site_settings'
    `);

    let siteSettingsData = null;
    if (tableCheck.rows.length > 0) {
      const settingsResult = await client.query('SELECT * FROM site_settings');
      siteSettingsData = settingsResult.rows;
    }

    // Also check what the API endpoint returns
    const apiResult = await client.query(`
      SELECT 
        id,
        contact_email,
        contact_phone,
        bio,
        linkedin_url,
        updated_at
      FROM site_settings 
      WHERE id = 1
    `);

    client.release();
    
    return res.json({
      tableExists: tableCheck.rows.length > 0,
      rawData: siteSettingsData,
      apiFormatData: apiResult.rows.length > 0 ? {
        id: apiResult.rows[0].id,
        contactEmail: apiResult.rows[0].contact_email,
        contactPhone: apiResult.rows[0].contact_phone,
        bio: apiResult.rows[0].bio,
        linkedinUrl: apiResult.rows[0].linkedin_url,
        updatedAt: apiResult.rows[0].updated_at
      } : null,
      bioExists: apiResult.rows.length > 0 && !!apiResult.rows[0].bio,
      bioLength: apiResult.rows.length > 0 ? (apiResult.rows[0].bio || '').length : 0
    });
    
  } catch (error) {
    console.error('Debug Bio API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 