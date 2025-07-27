import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

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

  try {
    console.log('Starting file upload process...');
    
    // Parse the form data
    const form = new IncomingForm({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        } else {
          console.log('Form parsed successfully');
          resolve([fields, files]);
        }
      });
    });

    const reportFile = Array.isArray(files.report) ? files.report[0] : files.report;
    
    if (!reportFile) {
      console.error('No report file provided');
      return res.status(400).json({ message: 'No report file provided' });
    }

    console.log('Report file details:', {
      originalFilename: reportFile.originalFilename,
      mimetype: reportFile.mimetype,
      size: reportFile.size
    });

    // Validate file type
    const allowedExtensions = ['.pdf', '.html', '.htm'];
    const fileExtension = path.extname(reportFile.originalFilename || '').toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only PDF and HTML files are allowed.' 
      });
    }

    // Create a safe filename
    const timestamp = Date.now();
    const safeName = reportFile.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_') || `report_${timestamp}`;
    const fileName = `${timestamp}_${safeName}`;

    // Since we can't write to filesystem in Vercel serverless, 
    // we'll convert the file to base64 and store it in the database or return it for client-side handling
    const fileBuffer = await fs.readFile(reportFile.filepath);
    const fileSize = fileBuffer.length;
    
    console.log(`File read successfully, size: ${fileSize} bytes`);

    // For now, let's create a data URL that can be used directly
    const mimeType = reportFile.mimetype || 'application/octet-stream';
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Clean up temporary file
    try {
      await fs.unlink(reportFile.filepath);
      console.log('Temporary file cleaned up');
    } catch (err) {
      console.warn('Could not clean up temp file:', err);
    }

    // Return the data URL and filename for the client to handle
    return res.json({
      success: true,
      fileName: fileName,
      originalName: reportFile.originalFilename,
      dataUrl: dataUrl,
      size: fileSize,
      mimeType: mimeType,
      message: 'File processed successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 