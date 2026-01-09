import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Helper to generate a display name from filename
function generateDisplayName(filename: string): string {
  // Remove extension
  let name = filename.replace(/\.(html|pdf)$/i, '');
  
  // Try to extract description if filename has " - " separator (e.g., "prefix - Description")
  const dashIndex = name.indexOf(' - ');
  if (dashIndex !== -1) {
    name = name.substring(dashIndex + 3); // Get everything after " - "
  }
  
  // Clean up underscores and extra spaces
  name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter if it's lowercase
  if (name.length > 0 && name[0] === name[0].toLowerCase()) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  return name;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // In production (Vercel), read from the pre-generated manifest
    const manifestPath = path.join(process.cwd(), 'public', 'reports-manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return res.status(200).json(manifest);
    }
    
    // Fallback: dynamically scan the reports directory (works in local dev)
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      return res.status(200).json({ reports: [], generatedAt: new Date().toISOString(), count: 0 });
    }
    
    const files = fs.readdirSync(reportsDir);
    const reportFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.html' || ext === '.pdf';
    });
    
    const reports = reportFiles.map(filename => {
      const ext = path.extname(filename).toLowerCase().slice(1);
      return {
        filename,
        url: `/reports/${filename}`,
        type: ext,
        displayName: generateDisplayName(filename)
      };
    });
    
    reports.sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    return res.status(200).json({
      reports,
      generatedAt: new Date().toISOString(),
      count: reports.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

