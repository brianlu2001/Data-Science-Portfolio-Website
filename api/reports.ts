import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { list } from '@vercel/blob';

function generateDisplayName(filename: string): string {
  let name = filename.replace(/\.(html|pdf|doc|docx)$/i, '');
  const dashIndex = name.indexOf(' - ');
  if (dashIndex !== -1) name = name.substring(dashIndex + 3);
  name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.length > 0 && name[0] === name[0].toLowerCase()) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  return name;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    // 1. Static reports committed to the repo (public/reports/)
    const staticReports: any[] = [];
    const manifestPath = path.join(process.cwd(), 'public', 'reports-manifest.json');

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      staticReports.push(...(manifest.reports || []));
    } else {
      const reportsDir = path.join(process.cwd(), 'public', 'reports');
      if (fs.existsSync(reportsDir)) {
        for (const filename of fs.readdirSync(reportsDir)) {
          const ext = path.extname(filename).toLowerCase();
          if (['.html', '.pdf', '.doc', '.docx'].includes(ext)) {
            staticReports.push({
              filename,
              url: `/reports/${filename}`,
              type: ext.slice(1),
              displayName: generateDisplayName(filename),
            });
          }
        }
      }
    }

    // 2. Reports uploaded at runtime via Vercel Blob (only if token is configured)
    const blobReports: any[] = [];
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list({ prefix: 'reports/' });
        for (const blob of blobs) {
          const filename = decodeURIComponent(blob.pathname.replace(/^reports\//, ''));
          const ext = path.extname(filename).toLowerCase();
          blobReports.push({
            filename,
            url: blob.url,
            type: ext.slice(1) || 'pdf',
            displayName: generateDisplayName(filename),
          });
        }
        console.log(`[api/reports] Found ${blobReports.length} blob-stored reports.`);
      } catch (err) {
        console.warn('[api/reports] Could not list blob reports:', err);
      }
    }

    // Merge: blob reports take precedence over static ones with the same filename
    const blobFilenames = new Set(blobReports.map(r => r.filename));
    const merged = [
      ...staticReports.filter(r => !blobFilenames.has(r.filename)),
      ...blobReports,
    ].sort((a, b) => a.displayName.localeCompare(b.displayName));

    return res.status(200).json({
      reports: merged,
      generatedAt: new Date().toISOString(),
      count: merged.length,
    });
  } catch (error) {
    console.error('[api/reports] Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch reports',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
