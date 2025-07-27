import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface AnalyticsSummary {
  totalPageViews: number;
  totalProjectClicks: number;
  topProjects: { projectId: number; projectTitle: string; clicks: number }[];
  dailyStats: { date: string; pageViews: number; projectClicks: number }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // Handle different analytics actions based on query parameter
  if (req.method === 'POST' && action === 'pageview') {
    return handlePageView(req, res);
  }
  
  if (req.method === 'POST' && action === 'project-click') {
    return handleProjectClick(req, res);
  }
  
  if (req.method === 'GET' && action === 'summary') {
    return handleSummary(req, res);
  }

  return res.status(400).json({ 
    message: 'Invalid action. Use ?action=pageview, ?action=project-click, or ?action=summary' 
  });
}

// Handle page view tracking
async function handlePageView(req: VercelRequest, res: VercelResponse) {
  try {
    const { page } = req.body;

    if (!page) {
      return res.status(400).json({ message: 'Page parameter is required' });
    }

    // Get client IP and user agent
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     null;

    // Clean up IP if it's an array (from x-forwarded-for)
    const cleanIp = Array.isArray(ipAddress) ? ipAddress[0] : 
                   typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : 
                   null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO page_views (page, user_agent, ip_address, timestamp)
        VALUES ($1, $2, $3, NOW())
      `, [page, userAgent, cleanIp]);

      console.log(`Recorded page view: ${page} from ${cleanIp}`);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Page view recorded',
        page 
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error recording page view:', error);
    return res.status(500).json({
      message: 'Failed to record page view',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handle project click tracking
async function handleProjectClick(req: VercelRequest, res: VercelResponse) {
  try {
    const { projectId, clickType } = req.body;

    if (!projectId || !clickType) {
      return res.status(400).json({ message: 'projectId and clickType are required' });
    }

    const validClickTypes = ['view', 'report', 'github'];
    if (!validClickTypes.includes(clickType)) {
      return res.status(400).json({ 
        message: 'Invalid clickType. Must be one of: view, report, github' 
      });
    }

    // Get client IP and user agent
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     null;

    // Clean up IP if it's an array (from x-forwarded-for)
    const cleanIp = Array.isArray(ipAddress) ? ipAddress[0] : 
                   typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : 
                   null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO project_clicks (project_id, click_type, user_agent, ip_address, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
      `, [parseInt(projectId), clickType, userAgent, cleanIp]);

      console.log(`Recorded project click: Project ${projectId} - ${clickType} from ${cleanIp}`);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Project click recorded',
        projectId,
        clickType
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error recording project click:', error);
    return res.status(500).json({
      message: 'Failed to record project click',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handle analytics summary
async function handleSummary(req: VercelRequest, res: VercelResponse) {
  try {
    const { timeWindow = '30d', startDate, endDate } = req.query;

    // Calculate date range
    let dateFilter = '';
    let dateParams: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE timestamp >= $1 AND timestamp <= $2';
      dateParams = [startDate, endDate];
    } else {
      const end = new Date();
      const start = new Date();
      
      switch (timeWindow) {
        case '7d':
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          start.setDate(end.getDate() - 30);
          break;
        case '90d':
          start.setDate(end.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(end.getFullYear() - 1);
          break;
        default:
          start.setDate(end.getDate() - 30);
      }
      
      dateFilter = 'WHERE timestamp >= $1 AND timestamp <= $2';
      dateParams = [start.toISOString(), end.toISOString()];
    }

    const client = await pool.connect();
    try {
      // Get total page views
      const pageViewsResult = await client.query(`
        SELECT COUNT(*) as count FROM page_views ${dateFilter}
      `, dateParams);
      const totalPageViews = parseInt(pageViewsResult.rows[0]?.count || 0);

      // Get total project clicks
      const clicksResult = await client.query(`
        SELECT COUNT(*) as count FROM project_clicks ${dateFilter}
      `, dateParams);
      const totalProjectClicks = parseInt(clicksResult.rows[0]?.count || 0);

      // Get top projects
      const topProjectsResult = await client.query(`
        SELECT 
          pc.project_id,
          p.title as project_title,
          COUNT(*) as clicks
        FROM project_clicks pc
        LEFT JOIN projects p ON pc.project_id = p.id
        ${dateFilter}
        GROUP BY pc.project_id, p.title
        ORDER BY clicks DESC
        LIMIT 10
      `, dateParams);

      const topProjects = topProjectsResult.rows.map(row => ({
        projectId: row.project_id,
        projectTitle: row.project_title || `Project ${row.project_id}`,
        clicks: parseInt(row.clicks)
      }));

      // Get daily stats
      const dailyStatsResult = await client.query(`
        WITH date_series AS (
          SELECT generate_series(
            $1::date, 
            $2::date, 
            '1 day'::interval
          )::date as date
        ),
        daily_page_views AS (
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as page_views
          FROM page_views 
          ${dateFilter}
          GROUP BY DATE(timestamp)
        ),
        daily_clicks AS (
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as project_clicks
          FROM project_clicks 
          ${dateFilter}
          GROUP BY DATE(timestamp)
        )
        SELECT 
          ds.date::text,
          COALESCE(dpv.page_views, 0) as page_views,
          COALESCE(dc.project_clicks, 0) as project_clicks
        FROM date_series ds
        LEFT JOIN daily_page_views dpv ON ds.date = dpv.date
        LEFT JOIN daily_clicks dc ON ds.date = dc.date
        ORDER BY ds.date
      `, dateParams);

      const dailyStats = dailyStatsResult.rows.map(row => ({
        date: row.date,
        pageViews: parseInt(row.page_views),
        projectClicks: parseInt(row.project_clicks)
      }));

      const summary: AnalyticsSummary = {
        totalPageViews,
        totalProjectClicks,
        topProjects,
        dailyStats
      };

      console.log(`Analytics summary: ${totalPageViews} views, ${totalProjectClicks} clicks`);
      
      return res.json(summary);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return res.status(500).json({
      message: 'Failed to fetch analytics summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 