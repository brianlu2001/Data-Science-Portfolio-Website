import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'crypto';
import ws from 'ws';

function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/admin_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token || !process.env.SESSION_SECRET) { res.status(401).json({ message: 'Unauthorized' }); return false; }
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const dot = decoded.lastIndexOf('.');
    const sig = decoded.slice(dot + 1);
    const expected = createHmac('sha256', process.env.SESSION_SECRET).update(decoded.slice(0, dot)).digest('hex');
    const ok = sig.length === expected.length && timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    if (!ok) { res.status(401).json({ message: 'Unauthorized' }); return false; }
  } catch { res.status(401).json({ message: 'Unauthorized' }); return false; }
  return true;
}

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`Simple Site Settings API: ${req.method} /api/site-settings-simple`);

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    console.log('Creating database connection...');
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    if (req.method === 'GET') {
      console.log('Fetching site settings with raw SQL...');

      const result = await client.query(`
        SELECT
          id,
          contact_email,
          contact_phone,
          bio,
          linkedin_url,
          logo_urls,
          updated_at
        FROM site_settings
        WHERE id = 1
      `);

      console.log(`Found ${result.rows.length} site settings`);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        const settings = {
          id: row.id,
          contactEmail: row.contact_email,
          contactPhone: row.contact_phone,
          bio: row.bio,
          linkedinUrl: row.linkedin_url,
          logoUrls: row.logo_urls || [],
          updatedAt: row.updated_at
        };

        client.release();
        console.log('Site settings found, bio length:', settings.bio ? settings.bio.length : 0);
        return res.json(settings);
      } else {
        client.release();
        console.log('No site settings found');
        return res.json({});
      }
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;
      console.log('Updating site settings with raw SQL...');
      const body = req.body;

      const result = await client.query(`
        UPDATE site_settings
        SET
          contact_email = $1,
          contact_phone = $2,
          bio = $3,
          linkedin_url = $4,
          logo_urls = $5,
          updated_at = NOW()
        WHERE id = 1
        RETURNING *
      `, [body.contactEmail, body.contactPhone, body.bio, body.linkedinUrl, body.logoUrls || []]);

      client.release();

      if (result.rows.length > 0) {
        const row = result.rows[0];
        const updatedSettings = {
          id: row.id,
          contactEmail: row.contact_email,
          contactPhone: row.contact_phone,
          bio: row.bio,
          linkedinUrl: row.linkedin_url,
          logoUrls: row.logo_urls || [],
          updatedAt: row.updated_at
        };

        console.log('Site settings updated successfully');
        return res.json(updatedSettings);
      } else {
        return res.status(404).json({ message: "Site settings not found" });
      }
    }

    client.release();
    return res.status(405).json({ message: "Method not allowed" });

  } catch (error) {
    console.error('Site Settings Simple API Error:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
} 