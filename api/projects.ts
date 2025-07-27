import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { projects } from '../shared/schema';
import { desc } from 'drizzle-orm';
import ws from 'ws';

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`Incoming request: ${req.method} /api/projects`);
  console.log('Environment check:', {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlLength: process.env.DATABASE_URL?.length || 0
  });

  try {
    // Database connection
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ message: "Database URL not configured" });
    }

    console.log('Creating database connection...');
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);
    console.log('Database connection created successfully');

    if (req.method === 'GET') {
      console.log('Fetching projects...');
      console.log('Database URL exists:', !!databaseUrl);
      console.log('Database URL preview:', databaseUrl ? databaseUrl.substring(0, 20) + '...' : 'undefined');
      
      try {
        // Test 1: Simple select without ordering
        console.log('Step 1: Testing basic select...');
        const simpleQuery = await db.select().from(projects).limit(1);
        console.log('Simple query successful, found records:', simpleQuery.length);
        
        // Test 2: Full select without ordering
        console.log('Step 2: Testing full select...');
        const allProjects = await db.select().from(projects);
        console.log(`Full select successful, found ${allProjects.length} projects`);
        
        // Test 3: Select with ordering (potential issue)
        console.log('Step 3: Testing select with ordering...');
        const projectList = await db.select().from(projects).orderBy(desc(projects.sortOrder));
        console.log(`Ordered select successful, found ${projectList.length} projects`);
        
        console.log('Sample project:', projectList[0] ? { id: projectList[0].id, title: projectList[0].title } : 'none');
        return res.json(projectList);
      } catch (dbError) {
        console.error('Database query error:', dbError);
        console.error('Error details:', {
          name: dbError instanceof Error ? dbError.name : 'Unknown',
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
        });
        return res.status(500).json({ 
          message: "Database query failed", 
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          details: dbError instanceof Error ? dbError.stack : undefined
        });
      }
    }

    if (req.method === 'POST') {
      console.log('Creating new project...');
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

      console.log('Project data:', projectData);
      const [newProject] = await db.insert(projects).values(projectData).returning();
      console.log('Project created successfully:', newProject.id);
      return res.status(201).json(newProject);
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