// Alternative routes file with Vercel authentication
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./vercelAuth";
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

  // Protected admin routes - simplified for Vercel
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

  const server = createServer(app);
  return server;
}