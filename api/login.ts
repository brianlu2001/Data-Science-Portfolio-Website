import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET' || req.method === 'POST') {
      // For Vercel deployment, redirect to admin page
      // In production, you would implement proper authentication here
      res.writeHead(302, { Location: '/admin' });
      return res.end();
    }
    
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 