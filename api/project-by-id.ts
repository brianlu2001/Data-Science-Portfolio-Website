import { endpoint, HttpError } from '../lib/security.js';
import { query, camelRow } from '../lib/database.js';
import { projectId } from '../lib/validation.js';
export default endpoint(['GET'], async (req, res) => {
  const { rows } = await query('SELECT * FROM projects WHERE id = $1', [projectId(req.query.id)]);
  if (!rows.length) throw new HttpError(404, 'Project not found');
  return res.json(camelRow(rows[0]));
});
