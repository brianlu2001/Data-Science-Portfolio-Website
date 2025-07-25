import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, updateProjectSchema, insertSiteSettingsSchema } from "../shared/schema";
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

  // Protected admin routes
  app.post('/api/projects', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      
      // Handle file upload
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
        const filePath = path.join('public', 'projects', fileName);
        
        fs.renameSync(req.file.path, filePath);
        validatedData.imageUrl = `/projects/${fileName}`;
      }

      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const validatedData = updateProjectSchema.parse(req.body);
      
      // Handle file upload
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
        const filePath = path.join('public', 'projects', fileName);
        
        fs.renameSync(req.file.path, filePath);
        validatedData.imageUrl = `/projects/${fileName}`;
      }

      const project = await storage.updateProject(projectId, validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Site settings routes
  app.post('/api/site-settings', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSiteSettingsSchema.parse(req.body);
      const settings = await storage.upsertSiteSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(400).json({ message: "Failed to update site settings", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Project files routes
  app.get('/api/projects/:id/files', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = await storage.getProjectFiles(projectId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching project files:", error);
      res.status(500).json({ message: "Failed to fetch project files" });
    }
  });

  app.post('/api/projects/:id/files', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      
      let filePath: string;
      let fileUrl: string;
      
      // Determine storage location based on file type
      if (fileExtension === '.pdf') {
        filePath = path.join('public', 'reports', fileName);
        fileUrl = `/reports/${fileName}`;
        
        // Ensure reports directory exists
        if (!fs.existsSync('public/reports')) {
          fs.mkdirSync('public/reports', { recursive: true });
        }
      } else {
        filePath = path.join('uploads', fileName);
        fileUrl = `/uploads/${fileName}`;
      }
      
      fs.renameSync(req.file.path, filePath);

      const fileData = {
        projectId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
      };

      const file = await storage.createProjectFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete('/api/project-files/:id', isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      await storage.deleteProjectFile(fileId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project file:", error);
      res.status(500).json({ message: "Failed to delete project file" });
    }
  });

  // Analytics routes
  app.post('/api/analytics/pageview', async (req, res) => {
    try {
      const { page } = req.body;
      await storage.recordPageView({
        page,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error recording page view:", error);
      res.status(500).json({ message: "Failed to record page view" });
    }
  });

  app.post('/api/analytics/project-click', async (req, res) => {
    try {
      const { projectId, clickType } = req.body;
      await storage.recordProjectClick({
        projectId: parseInt(projectId),
        clickType,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error recording project click:", error);
      res.status(500).json({ message: "Failed to record project click" });
    }
  });

  app.get('/api/analytics/summary', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const summary = await storage.getAnalyticsSummary(start, end);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  const server = createServer(app);
  return server;
}