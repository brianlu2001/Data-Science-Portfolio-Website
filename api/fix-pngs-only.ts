import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Only the PNG files that need fixing (keeping URLs unchanged)
const PNG_FIXES: { [key: number]: string } = {
  2: '/uploads/itri-logo-updated.png', // Startup Success
  3: '/uploads/bert-diagram.png', // BERT Analysis  
  4: '/uploads/finance-ml.png', // Financial Risk
  5: '/uploads/compressed-sensing.png', // Compressed Sensing
  7: '/uploads/yelp-logo.png', // Restaurant Filtering
  9: '/uploads/spx-chart.png' // SPX Time Series
  // Projects 1, 6, 8, 10 have working URLs - DON'T TOUCH THEM
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
      // Check current state
      const result = await client.query(`
        SELECT id, title, image_url
        FROM projects 
        ORDER BY sort_order ASC
      `);

      client.release();

      const status = result.rows.map(row => {
        const isUrl = row.image_url && (row.image_url.startsWith('http') || row.image_url.includes('://'));
        const needsPngFix = PNG_FIXES[row.id] && !isUrl;
        
        return {
          id: row.id,
          title: row.title,
          currentImageUrl: row.image_url,
          type: isUrl ? 'URL (keep)' : 'PNG (might need fix)',
          needsFix: needsPngFix,
          plannedFix: PNG_FIXES[row.id] || 'N/A'
        };
      });

      return res.json({
        message: "PNG fix status - will only touch PNG files, preserve URLs",
        status,
        summary: {
          total: status.length,
          urlsBased: status.filter(s => s.type === 'URL (keep)').length,
          pngNeedingFix: status.filter(s => s.needsFix).length
        }
      });
    }

    if (req.method === 'POST') {
      // Fix ONLY the PNG files, preserve URLs
      console.log('🔧 Fixing only PNG files, preserving working URLs...');

      const updates: Array<{
        id: number;
        title: string;
        oldImageUrl: string;
        newImageUrl: string;
      }> = [];

      // Get current state
      const result = await client.query(`
        SELECT id, title, image_url
        FROM projects 
        ORDER BY sort_order ASC
      `);

      for (const row of result.rows) {
        const currentImageUrl = row.image_url || '';
        
        // Skip if it's a URL-based image (working ones)
        if (currentImageUrl.startsWith('http') || currentImageUrl.includes('://')) {
          console.log(`⏭️ Skipping URL-based image for "${row.title}": ${currentImageUrl}`);
          continue;
        }
        
        // Only fix if we have a specific PNG fix for this project
        const pngFix = PNG_FIXES[row.id];
        if (pngFix && currentImageUrl !== pngFix) {
          await client.query(`
            UPDATE projects 
            SET image_url = $1 
            WHERE id = $2
          `, [pngFix, row.id]);

          updates.push({
            id: row.id,
            title: row.title,
            oldImageUrl: currentImageUrl,
            newImageUrl: pngFix
          });

          console.log(`✅ Fixed PNG for "${row.title}": ${currentImageUrl} → ${pngFix}`);
        }
      }

      client.release();

      return res.json({
        message: `✅ Fixed ${updates.length} PNG files while preserving ${result.rows.filter(r => (r.image_url || '').startsWith('http')).length} working URLs!`,
        updates,
        note: "Only PNG files were updated, all URL-based images were left untouched"
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