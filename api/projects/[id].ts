import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { projects } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Database connection
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);

    // Extract project ID from URL
    const { id } = req.query;
    const projectId = parseInt(id as string);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    if (req.method === 'GET') {
      console.log(`Fetching project ${projectId}...`);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      return res.json(project);
    }

    if (req.method === 'PUT') {
      console.log(`Updating project ${projectId}...`);
      const body = req.body;
      
      // Parse technologies if it's a string
      let technologies = body.technologies;
      if (typeof technologies === 'string') {
        try {
          technologies = JSON.parse(technologies);
        } catch (e) {
          technologies = [];
        }
      }

      const projectData = {
        title: body.title,
        simplifiedDescription: body.simplifiedDescription,
        fullDescription: body.fullDescription,
        technologies: technologies || [],
        category: body.category,
        imageUrl: body.imageUrl || null,
        projectUrl: body.projectUrl || null,
        githubUrl: body.githubUrl || null,
        sortOrder: parseInt(body.sortOrder) || 0,
      };

      console.log('Updating project data:', projectData);
      const [updatedProject] = await db
        .update(projects)
        .set(projectData)
        .where(eq(projects.id, projectId))
        .returning();
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      console.log('Project updated successfully:', updatedProject.id);
      return res.json(updatedProject);
    }

    if (req.method === 'DELETE') {
      console.log(`Deleting project ${projectId}...`);
      const [deletedProject] = await db
        .delete(projects)
        .where(eq(projects.id, projectId))
        .returning();
      
      if (!deletedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      console.log('Project deleted successfully:', deletedProject.id);
      return res.json({ message: "Project deleted successfully", project: deletedProject });
    }
    
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
} 