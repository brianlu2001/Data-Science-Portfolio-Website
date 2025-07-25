import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { page } = req.body;
    await storage.recordPageView({
      page,
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown',
    });
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Analytics Error:', error);
    return res.status(500).json({ 
      message: "Failed to record page view", 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}