import { endpoint, requireAuth } from '../lib/security.js';
import { query, camelRow } from '../lib/database.js';
import { parse, settingsSchema } from '../lib/validation.js';
export default endpoint(['GET', 'PUT'], async (req, res) => {
  if (req.method === 'GET') return res.json(camelRow((await query('SELECT * FROM site_settings WHERE id = 1')).rows[0] ?? {}));
  await requireAuth(req);
  const s = parse(settingsSchema, req.body);
  const { rows } = await query(`UPDATE site_settings SET contact_email=$1,contact_phone=$2,bio=$3,
    linkedin_url=$4,logo_urls=$5,updated_at=NOW() WHERE id=1 RETURNING *`,
    [s.contactEmail ?? null,s.contactPhone ?? null,s.bio ?? null,s.linkedinUrl ?? null,s.logoUrls]);
  return res.json(camelRow(rows[0] ?? {}));
});
