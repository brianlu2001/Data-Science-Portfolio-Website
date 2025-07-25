import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertProjectSchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const projects = await storage.getProjects();
      return res.json(projects);
    }
    
    if (req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (authHeader !== 'Bearer admin') {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      return res.status(201).json(project);
    }
    
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}