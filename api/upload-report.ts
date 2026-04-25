import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';

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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Only POST method allowed' });
  if (!requireAuth(req, res)) return;

  console.log('[upload-report] Parsing multipart form...');

  try {
    const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB for reports
    const form = new IncomingForm({ maxFileSize: MAX_SIZE_BYTES });

    const [, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) { console.error('[upload-report] Parse error:', err.message); reject(err); }
        else resolve([fields, files]);
      });
    });

    const reportFile = Array.isArray(files.report) ? files.report[0] : files.report;

    if (!reportFile) {
      console.error('[upload-report] No "report" field. Keys received:', Object.keys(files));
      return res.status(400).json({ message: 'No report file provided' });
    }

    console.log(`[upload-report] File: "${reportFile.originalFilename}" | ${reportFile.mimetype} | ${(reportFile.size / 1024 / 1024).toFixed(2)} MB`);

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(reportFile.mimetype)) {
      console.error(`[upload-report] Rejected mimetype: ${reportFile.mimetype}`);
      return res.status(400).json({ message: `Invalid file type "${reportFile.mimetype}". Only PDF, DOC, DOCX allowed.` });
    }

    const fileName = reportFile.originalFilename || `report-${Date.now()}`;

    console.log(`[upload-report] Reading tmp file: ${reportFile.filepath}`);
    const fileBuffer = await fs.readFile(reportFile.filepath);

    console.log(`[upload-report] Uploading to Vercel Blob as "reports/${fileName}"...`);
    const blob = await put(`reports/${fileName}`, fileBuffer, {
      access: 'public',
      contentType: reportFile.mimetype,
    });

    console.log(`[upload-report] Blob URL: ${blob.url}`);

    try { await fs.unlink(reportFile.filepath); } catch {}

    return res.json({
      success: true,
      reportUrl: blob.url,
      fileName,
      message: 'Report uploaded successfully',
    });

  } catch (error) {
    console.error('[upload-report] Unhandled error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
