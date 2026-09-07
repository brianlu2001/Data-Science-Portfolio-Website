import { endpoint, requireAuth } from '../lib/security.js';
import { query, transaction, camelRow } from '../lib/database.js';
import { parse, projectSchema } from '../lib/validation.js';
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') return res.json((await query('SELECT * FROM projects ORDER BY sort_order ASC')).rows.map(camelRow));
  await requireAuth(req);
  const p = parse(projectSchema, req.body);
  const row = await transaction(async client => {
    await client.query('UPDATE projects SET sort_order = sort_order + 1');
    const { rows } = await client.query(`INSERT INTO projects
      (title, simplified_description, full_description, technologies, category, image_url, project_url, github_url, status, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0) RETURNING *`,
      [p.title,p.simplifiedDescription,p.fullDescription,p.technologies,p.category ?? null,p.imageUrl ?? null,p.projectUrl ?? null,p.githubUrl ?? '',p.status]);
    return rows[0];
  });
  return res.status(201).json(camelRow(row));
});
