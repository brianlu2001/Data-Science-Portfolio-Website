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

  console.log('[upload-image] Parsing multipart form...');

  try {
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
    const form = new IncomingForm({ maxFileSize: MAX_SIZE_BYTES });

    const [, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) { console.error('[upload-image] Parse error:', err.message); reject(err); }
        else resolve([fields, files]);
      });
    });

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      console.error('[upload-image] No "image" field. Keys received:', Object.keys(files));
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log(`[upload-image] File: "${imageFile.originalFilename}" | ${imageFile.mimetype} | ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      console.error(`[upload-image] Rejected mimetype: ${imageFile.mimetype}`);
      return res.status(400).json({ message: `Invalid file type "${imageFile.mimetype}". Only JPG, PNG, GIF, WebP allowed.` });
    }

    if (imageFile.size > MAX_SIZE_BYTES) {
      console.error(`[upload-image] File too large: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
      return res.status(413).json({ message: 'File too large. Maximum is 20 MB.' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[upload-image] BLOB_READ_WRITE_TOKEN is not set');
      return res.status(500).json({ message: 'Storage not configured: BLOB_READ_WRITE_TOKEN is missing. Add a Vercel Blob store to your project in the Vercel dashboard.' });
    }

    const fileName = imageFile.originalFilename || `image-${Date.now()}`;

    // Read temp file written by formidable, then upload to Vercel Blob
    console.log(`[upload-image] Reading tmp file: ${imageFile.filepath}`);
    const fileBuffer = await fs.readFile(imageFile.filepath);

    console.log(`[upload-image] Uploading to Vercel Blob as "uploads/${fileName}"...`);
    const blob = await put(`uploads/${fileName}`, fileBuffer, {
      access: 'public',
      contentType: imageFile.mimetype,
    });

    console.log(`[upload-image] Blob URL: ${blob.url}`);

    // Clean up formidable temp file
    try { await fs.unlink(imageFile.filepath); } catch {}

    return res.json({
      success: true,
      imageUrl: blob.url,
      fileName,
      message: 'Image uploaded successfully',
    });

  } catch (error) {
    console.error('[upload-image] Unhandled error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
