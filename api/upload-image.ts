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

  try {
    // Parse the form data
    const form = new IncomingForm();
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    
    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' 
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Keep original filename (as requested)
    const fileName = imageFile.originalFilename || `image-${Date.now()}`;
    const filePath = path.join(uploadsDir, fileName);

    // Copy file to uploads directory
    await fs.copyFile(imageFile.filepath, filePath);

    // Clean up temporary file
    try {
      await fs.unlink(imageFile.filepath);
    } catch (err) {
      console.warn('Could not clean up temp file:', err);
    }

    // Return the public URL
    const imageUrl = `/uploads/${fileName}`;

    return res.json({
      success: true,
      imageUrl,
      fileName,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 