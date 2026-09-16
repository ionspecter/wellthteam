import { json } from '../../_auth.js';

// GET /api/admin/rsvps — requires the same X-Admin-Key you already use
// for /api/register and the masterclass admin endpoints.
export async function onRequestGet({ request, env }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (!adminKey || adminKey !== env.ADMIN_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, name, contact, email, attendees, source, message, created_at
     FROM mentalhealth_rsvps
     ORDER BY created_at DESC`
  ).all();

  return json({ rsvps: results });
}
