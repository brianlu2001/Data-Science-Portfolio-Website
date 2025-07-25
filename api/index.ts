// Vercel API entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertProjectSchema, insertSiteSettingsSchema } from '../shared/schema';

// Simple auth check for Vercel
const isAuthenticated = (req: VercelRequest) => {
  const authHeader = req.headers.authorization;
  return authHeader === 'Bearer admin';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Route handling
    if (url === '/api/projects' && method === 'GET') {
      const projects = await storage.getProjects();
      return res.json(projects);
    }
    
    if (url?.startsWith('/api/projects/') && method === 'GET') {
      const id = parseInt(url.split('/')[3]);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.json(project);
    }
    
    if (url === '/api/site-settings' && method === 'GET') {
      const settings = await storage.getSiteSettings();
      return res.json(settings || {});
    }
    
    if (url === '/api/auth/user' && method === 'GET') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (url === '/api/analytics/pageview' && method === 'POST') {
      const { page } = req.body;
      await storage.recordPageView({
        page,
        userAgent: req.headers['user-agent'],
        ipAddress: req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown',
      });
      return res.status(201).json({ success: true });
    }
    
    if (url === '/api/projects' && method === 'POST') {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      return res.status(201).json(project);
    }
    
    // Default 404
    return res.status(404).json({ message: `Route ${url} not found` });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}