import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
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

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method allowed' });
  }

  if (!requireAuth(req, res)) return;

  console.log('[upload-image] Incoming request, parsing multipart form...');

  try {
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
    const form = new IncomingForm({ maxFileSize: MAX_SIZE_BYTES });

    const [, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('[upload-image] formidable parse error:', err.message, err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      console.error('[upload-image] No "image" field in form data. Fields received:', Object.keys(files));
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log(`[upload-image] File received: "${imageFile.originalFilename}" | mimetype: ${imageFile.mimetype} | size: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB | tmp: ${imageFile.filepath}`);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      console.error(`[upload-image] Rejected mimetype: ${imageFile.mimetype}`);
      return res.status(400).json({
        message: `Invalid file type "${imageFile.mimetype}". Only JPG, PNG, GIF, and WebP are allowed.`
      });
    }

    if (imageFile.size > MAX_SIZE_BYTES) {
      console.error(`[upload-image] File too large: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
      return res.status(413).json({ message: `File too large. Maximum is 20 MB.` });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log(`[upload-image] Target directory: ${uploadsDir}`);

    try {
      await fs.access(uploadsDir);
      console.log('[upload-image] Uploads directory exists.');
    } catch {
      console.log('[upload-image] Uploads directory missing, creating...');
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const fileName = imageFile.originalFilename || `image-${Date.now()}`;
    const filePath = path.join(uploadsDir, fileName);
    console.log(`[upload-image] Copying to: ${filePath}`);

    await fs.copyFile(imageFile.filepath, filePath);
    console.log('[upload-image] File saved successfully.');

    try {
      await fs.unlink(imageFile.filepath);
    } catch (err) {
      console.warn('[upload-image] Could not clean up temp file:', err);
    }

    const imageUrl = `/uploads/${fileName}`;
    console.log(`[upload-image] Done. Returning imageUrl: ${imageUrl}`);

    return res.json({
      success: true,
      imageUrl,
      fileName,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('[upload-image] Unhandled error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 