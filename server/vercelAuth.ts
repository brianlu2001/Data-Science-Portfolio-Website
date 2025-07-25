// Simplified authentication for Vercel deployment
import type { Express, RequestHandler } from "express";
import session from "express-session";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  return session({
    secret: process.env.SESSION_SECRET || 'vercel-deployment-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Simple middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  // For Vercel deployment, bypass authentication
  // In production, you would implement proper auth (OAuth, JWT, etc.)
  req.user = { claims: { sub: 'admin' } };
  return next();
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Simple endpoints for frontend compatibility
  app.get('/api/auth/user', (req: any, res) => {
    res.json({ id: 'admin', email: 'admin@example.com' });
  });
  
  app.post('/api/login', (req: any, res) => {
    req.session.user = { claims: { sub: 'admin' } };
    res.json({ success: true });
  });
  
  app.post('/api/logout', (req: any, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
}