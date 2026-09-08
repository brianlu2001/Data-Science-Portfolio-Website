import { endpoint, requireAuth, HttpError } from '../../lib/security.js';
import { query, transaction, camelRow } from '../../lib/database.js';
import { parse, projectUpdateSchema, projectId } from '../../lib/validation.js';
const columns = {
  title:'title', simplifiedDescription:'simplified_description', fullDescription:'full_description',
  technologies:'technologies', category:'category', imageUrl:'image_url', projectUrl:'project_url',
  githubUrl:'github_url', status:'status', sortOrder:'sort_order',
} as const;
export default endpoint(['GET', 'PUT', 'PATCH', 'DELETE'], async (req, res) => {
  if (req.method !== 'GET') await requireAuth(req);
  const id = projectId(req.query.id);
  let rows;
  if (req.method === 'GET') ({ rows } = await query('SELECT * FROM projects WHERE id = $1', [id]));
  else if (req.method === 'DELETE') rows = await transaction(async client => {
    await client.query('DELETE FROM project_clicks WHERE project_id = $1', [id]);
    await client.query('DELETE FROM project_files WHERE project_id = $1', [id]);
    return (await client.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id])).rows;
  });
  else {
    const p = parse(projectUpdateSchema, req.body);
    const fields = (Object.keys(columns) as (keyof typeof columns)[]).filter(key => p[key] !== undefined);
    const assignments = fields.map((key, index) => `${columns[key]}=$${index + 1}`);
    ({ rows } = await query(`UPDATE projects SET ${assignments.join(',')},updated_at=NOW()
      WHERE id=$${fields.length + 1} RETURNING *`, [...fields.map(key => p[key]), id]));
  }
  if (!rows.length) throw new HttpError(404, 'Project not found');
  return res.json(req.method === 'DELETE' ? { success: true } : camelRow(rows[0]));
});
