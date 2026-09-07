import { z } from 'zod';
import { endpoint, requireAuth, rateLimit, clientKey, HttpError } from '../lib/security.js';
import { query } from '../lib/database.js';
import { parse } from '../lib/validation.js';
export default endpoint(['GET','POST'], async (req, res) => {
  const action = req.query.action;
  if (req.method === 'POST') {
    if (action !== 'pageview' && action !== 'project-click') throw new HttpError(400, 'Invalid action');
    const data = action === 'pageview'
      ? parse(z.object({ page: z.string().max(255).regex(/^\/[a-zA-Z0-9/_-]*$/) }), req.body)
      : parse(z.object({ projectId: z.number().int().positive().max(2147483647), clickType: z.enum(['view','report','github']) }), req.body);
    await rateLimit('analytics:' + clientKey(req), 60, 60, res);
    await rateLimit('analytics:global', 1000, 60, res);
    // Only aggregate event data is needed; do not retain visitor IPs or user agents.
    if ('page' in data) await query('INSERT INTO page_views (page,timestamp) VALUES ($1,NOW())', [data.page]);
    else {
      const result = await query(`INSERT INTO project_clicks (project_id,click_type,timestamp)
        SELECT id,$2,NOW() FROM projects WHERE id=$1 RETURNING id`, [data.projectId,data.clickType]);
      if (!result.rows.length) throw new HttpError(400, 'Invalid project');
    }
    return res.status(201).json({ success: true });
  }
  await requireAuth(req);
  if (action !== 'summary') throw new HttpError(400, 'Invalid action');
  const options = parse(z.object({
    action: z.literal('summary'), timeWindow: z.enum(['7d','30d','90d','1y']).default('30d'),
    startDate: z.string().max(30).optional(), endDate: z.string().max(30).optional(),
  }), req.query);
  const days = { '7d':7, '30d':30, '90d':90, '1y':365 }[options.timeWindow];
  const end = options.endDate ? new Date(options.endDate) : new Date();
  const start = options.startDate ? new Date(options.startDate) : new Date(end.getTime() - days * 86400000);
  if (!!options.startDate !== !!options.endDate || !Number.isFinite(+start) || !Number.isFinite(+end) ||
      +end < +start || +end - +start > 366 * 86400000) throw new HttpError(400, 'Date range must be at most 366 days');
  await rateLimit('analytics:summary', 60, 60, res);
  const values = [start.toISOString(), end.toISOString()];
  const views = await query('SELECT COUNT(*) AS count FROM page_views WHERE timestamp BETWEEN $1 AND $2', values);
  const clicks = await query('SELECT COUNT(*) AS count FROM project_clicks WHERE timestamp BETWEEN $1 AND $2', values);
  const top = await query(`SELECT p.id,p.title,COUNT(*) AS clicks FROM project_clicks pc JOIN projects p ON p.id=pc.project_id
    WHERE pc.timestamp BETWEEN $1 AND $2 GROUP BY p.id,p.title ORDER BY clicks DESC LIMIT 10`, values);
  const daily = await query(`WITH dates AS (SELECT generate_series($1::date,$2::date,'1 day'::interval)::date AS date),
    views AS (SELECT timestamp::date AS date,COUNT(*) AS count FROM page_views WHERE timestamp BETWEEN $1 AND $2 GROUP BY 1),
    clicks AS (SELECT timestamp::date AS date,COUNT(*) AS count FROM project_clicks WHERE timestamp BETWEEN $1 AND $2 GROUP BY 1)
    SELECT dates.date::text,COALESCE(views.count,0) AS views,COALESCE(clicks.count,0) AS clicks FROM dates
    LEFT JOIN views USING(date) LEFT JOIN clicks USING(date) ORDER BY dates.date`, values);
  return res.json({ totalPageViews: Number(views.rows[0].count), totalProjectClicks: Number(clicks.rows[0].count),
    topProjects: top.rows.map(r => ({ projectId:r.id,projectTitle:r.title,clicks:Number(r.clicks) })),
    dailyStats: daily.rows.map(r => ({ date:r.date,pageViews:Number(r.views),projectClicks:Number(r.clicks) })) });
});
