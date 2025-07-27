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
    // Parse the form data
    const form = new IncomingForm();
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const reportFile = Array.isArray(files.report) ? files.report[0] : files.report;
    
    if (!reportFile) {
      return res.status(400).json({ message: 'No report file provided' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/html', 'application/html'];
    const allowedExtensions = ['.pdf', '.html', '.htm'];
    
    const fileExtension = path.extname(reportFile.originalFilename || '').toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only PDF and HTML files are allowed.' 
      });
    }

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    try {
      await fs.access(reportsDir);
    } catch {
      await fs.mkdir(reportsDir, { recursive: true });
    }

    // Keep original filename (as requested for projects)
    const fileName = reportFile.originalFilename || `report-${Date.now()}${fileExtension}`;
    const filePath = path.join(reportsDir, fileName);

    // Copy file to reports directory
    await fs.copyFile(reportFile.filepath, filePath);

    // Clean up temporary file
    try {
      await fs.unlink(reportFile.filepath);
    } catch (err) {
      console.warn('Could not clean up temp file:', err);
    }

    // Return the public URL
    const reportUrl = `/reports/${fileName}`;

    return res.json({
      success: true,
      reportUrl,
      fileName,
      message: 'Report uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 