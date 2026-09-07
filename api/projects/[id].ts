import { endpoint, requireAuth, HttpError } from '../../lib/security.js';
import { query, transaction, camelRow } from '../../lib/database.js';
import { parse, projectSchema, projectId } from '../../lib/validation.js';
export default endpoint(['GET', 'PUT', 'DELETE'], async (req, res) => {
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
    const p = parse(projectSchema, req.body);
    ({ rows } = await query(`UPDATE projects SET title=$1,simplified_description=$2,full_description=$3,
      technologies=$4,category=$5,image_url=$6,project_url=$7,github_url=$8,status=$9,
      sort_order=COALESCE($10,sort_order),updated_at=NOW() WHERE id=$11 RETURNING *`,
      [p.title,p.simplifiedDescription,p.fullDescription,p.technologies,p.category ?? null,p.imageUrl ?? null,p.projectUrl ?? null,p.githubUrl ?? '',p.status,p.sortOrder ?? null,id]));
  }
  if (!rows.length) throw new HttpError(404, 'Project not found');
  return res.json(req.method === 'DELETE' ? { success: true } : camelRow(rows[0]));
});
