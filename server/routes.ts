import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, updateProjectSchema, insertSiteSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log("File upload filter:", file);
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }

  // Ensure public/projects directory exists
  if (!fs.existsSync('public/projects')) {
    fs.mkdirSync('public/projects', { recursive: true });
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.get('/api/projects/:id/files', async (req, res) => {
    try {
      const files = await storage.getProjectFiles(parseInt(req.params.id));
      res.json(files);
    } catch (error) {
      console.error("Error fetching project files:", error);
      res.status(500).json({ message: "Failed to fetch project files" });
    }
  });

  // Protected admin routes
  app.post('/api/projects', isAuthenticated, upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'report', maxCount: 1 }
  ]), async (req, res) => {
    try {
      // Parse technologies if it's a JSON string
      if (req.body.technologies && typeof req.body.technologies === 'string') {
        try {
          req.body.technologies = JSON.parse(req.body.technologies);
        } catch (e) {
          req.body.technologies = [];
        }
      }
      
      const validatedData = insertProjectSchema.parse(req.body);
      
      let imageUrl = null;
      let projectUrl = null;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Handle image upload
      if (files && files.image && files.image[0]) {
        const file = files.image[0];
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join('public/projects', fileName);
        fs.renameSync(file.path, filePath);
        imageUrl = `/projects/${fileName}`;
      }

      // Handle report upload
      if (files && files.report && files.report[0]) {
        const file = files.report[0];
        const fileName = `${Date.now()}-${file.originalname}`;
        
        // Ensure reports directory exists
        const reportsDir = path.join('public/reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);
        fs.renameSync(file.path, filePath);
        projectUrl = `/reports/${fileName}`;
      }

      const project = await storage.createProject({
        ...validatedData,
        imageUrl,
        projectUrl,
      });

      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'report', maxCount: 1 }
  ]), async (req, res) => {
    try {
      // Parse technologies if it's a JSON string
      if (req.body.technologies && typeof req.body.technologies === 'string') {
        try {
          req.body.technologies = JSON.parse(req.body.technologies);
        } catch (e) {
          req.body.technologies = [];
        }
      }
      
      // Convert sortOrder to number if it exists
      if (req.body.sortOrder && typeof req.body.sortOrder === 'string') {
        req.body.sortOrder = parseInt(req.body.sortOrder);
      }
      
      const validatedData = updateProjectSchema.parse(req.body);
      
      let imageUrl = validatedData.imageUrl;
      let projectUrl = validatedData.projectUrl;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Handle image upload
      if (files && files.image && files.image[0]) {
        const file = files.image[0];
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join('public/projects', fileName);
        fs.renameSync(file.path, filePath);
        imageUrl = `/projects/${fileName}`;
      }

      // Handle report upload
      if (files && files.report && files.report[0]) {
        const file = files.report[0];
        const fileName = `${Date.now()}-${file.originalname}`;
        
        // Ensure reports directory exists
        const reportsDir = path.join('public/reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);
        fs.renameSync(file.path, filePath);
        projectUrl = `/reports/${fileName}`;
      }

      const project = await storage.updateProject(parseInt(req.params.id), {
        ...validatedData,
        imageUrl,
        projectUrl,
      });

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(parseInt(req.params.id));
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  app.post('/api/site-settings', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSiteSettingsSchema.parse(req.body);
      
      const settings = await storage.upsertSiteSettings(validatedData);

      res.json(settings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });

  // Analytics routes
  app.post('/api/analytics/pageview', async (req, res) => {
    try {
      const { page } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      await storage.recordPageView({
        page,
        userAgent,
        ipAddress,
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error recording page view:', error);
      res.status(500).json({ error: 'Failed to record page view' });
    }
  });

  app.post('/api/analytics/project-click', async (req, res) => {
    try {
      const { projectId, clickType } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      await storage.recordProjectClick({
        projectId: parseInt(projectId),
        clickType,
        userAgent,
        ipAddress,
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error recording project click:', error);
      res.status(500).json({ error: 'Failed to record project click' });
    }
  });

  app.get('/api/analytics/summary', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const summary = await storage.getAnalyticsSummary(start, end);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
  });

  app.get('/api/analytics/page-views', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const pageViews = await storage.getPageViews(start, end);
      res.json(pageViews);
    } catch (error) {
      console.error('Error fetching page views:', error);
      res.status(500).json({ error: 'Failed to fetch page views' });
    }
  });

  app.get('/api/analytics/project-clicks', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const projectClicks = await storage.getProjectClicks(start, end);
      res.json(projectClicks);
    } catch (error) {
      console.error('Error fetching project clicks:', error);
      res.status(500).json({ error: 'Failed to fetch project clicks' });
    }
  });

  // Static file serving for projects
  app.use('/projects', express.static(path.join(process.cwd(), 'public/projects')));

  const httpServer = createServer(app);
  return httpServer;
}
