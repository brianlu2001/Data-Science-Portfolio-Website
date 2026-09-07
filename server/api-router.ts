import express from 'express';
import type { VercelRequest, VercelResponse } from '../lib/http.js';
import auth from '../api/auth.js';
import projects from '../api/projects-simple.js';
import project from '../api/projects/[id].js';
import projectById from '../api/project-by-id.js';
import settings from '../api/site-settings-simple.js';
import order from '../api/update-project-order.js';
import analytics from '../api/analytics.js';
import reports from '../api/reports.js';
import image from '../api/upload-image.js';
import report from '../api/upload-report.js';
import rewrite from '../api/rewrite-description.js';
export function apiRouter() {
  const router = express.Router();
  const routes = { '/auth':auth, '/projects-simple':projects, '/projects/:id':project,
    '/project-by-id':projectById, '/site-settings-simple':settings, '/update-project-order':order,
    '/analytics':analytics, '/reports':reports, '/upload-image':image, '/upload-report':report, '/rewrite-description':rewrite };
  for (const [path, handler] of Object.entries(routes)) router.all(path, async (req, res, next) => {
    try {
      req.query = { ...req.query, ...req.params };
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    } catch (error) { next(error); }
  });
  router.use((_req, res) => res.status(404).json({ message: 'Not found' }));
  return router;
}
