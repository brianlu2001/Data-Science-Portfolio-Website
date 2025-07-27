import type { VercelRequest, VercelResponse } from '@vercel/node';
import { existsSync, readdirSync } from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const results = {
      currentWorkingDirectory: process.cwd(),
      uploadsExists: false,
      publicExists: false,
      distPublicExists: false,
      uploadsContents: [],
      publicUploadsContents: [],
      distPublicUploadsContents: []
    };

    // Check various possible locations
    const locations = [
      { name: 'uploads', path: 'uploads' },
      { name: 'public/uploads', path: 'public/uploads' },
      { name: 'dist/public/uploads', path: 'dist/public/uploads' },
      { name: './uploads', path: './uploads' },
      { name: '../uploads', path: '../uploads' },
      { name: '/var/task/uploads', path: '/var/task/uploads' },
      { name: '/var/task/public/uploads', path: '/var/task/public/uploads' }
    ];

    for (const location of locations) {
      try {
        if (existsSync(location.path)) {
          const contents = readdirSync(location.path);
          results[`${location.name.replace('/', '_')}_exists`] = true;
          results[`${location.name.replace('/', '_')}_contents`] = contents;
        }
      } catch (e) {
        // Directory doesn't exist or can't be read
      }
    }

    return res.json({
      message: "File system diagnostic",
      results,
      expectedFiles: [
        'bert-diagram.png',
        'compressed-sensing.png',
        'finance-ml.png',
        'itri-logo-updated.png',
        'spx-chart.png',
        'yelp-logo.png'
      ]
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error checking files",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 