import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // Handle different auth actions based on query parameter
  if (action === 'login') {
    return handleLogin(req, res);
  }
  
  if (action === 'logout') {
    return handleLogout(req, res);
  }
  
  if (req.method === 'GET' && action === 'user') {
    return handleGetUser(req, res);
  }

  return res.status(400).json({ 
    message: 'Invalid action. Use ?action=login, ?action=logout, or ?action=user' 
  });
}

// Handle login
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Login request received, redirecting to /admin');
    // For Vercel deployment, redirect to admin
    res.redirect(302, '/admin');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handle logout
async function handleLogout(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Logout request received, redirecting to /');
    // For Vercel deployment, redirect to homepage
    res.redirect(302, '/');
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handle get user (mock for Vercel)
async function handleGetUser(req: VercelRequest, res: VercelResponse) {
  try {
    // Mock user data for Vercel deployment
    const mockUser = {
      id: "admin",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.json(mockUser);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      message: 'Failed to get user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 