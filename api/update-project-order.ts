import { z } from 'zod';
import { endpoint, requireAuth } from '../lib/security.js';
import { transaction } from '../lib/database.js';
import { parse } from '../lib/validation.js';
export default endpoint(['PUT'], async (req, res) => {
  await requireAuth(req);
  const { projects } = parse(z.object({ projects: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0).max(100000) })).max(500) }), req.body);
  await transaction(async client => {
    for (const p of projects) await client.query('UPDATE projects SET sort_order=$1,updated_at=NOW() WHERE id=$2', [p.sortOrder,p.id]);
  });
  return res.json({ success: true, updatedCount: projects.length });
});
