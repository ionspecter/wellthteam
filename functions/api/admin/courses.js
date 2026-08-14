import { json } from '../../_auth.js';

// POST /api/admin/courses  { title, description, thumbnail?, sort_order? }
export async function onRequestPost({ request, env }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (!adminKey || adminKey !== env.ADMIN_KEY) return json({ error: 'Unauthorized' }, 401);

  const { title, description, thumbnail, sort_order } = await request.json().catch(() => ({}));
  if (!title) return json({ error: 'title is required' }, 400);

  const result = await env.DB.prepare(
    `INSERT INTO courses (title, description, thumbnail, sort_order) VALUES (?, ?, ?, ?)`
  ).bind(title.trim(), description || null, thumbnail || null, sort_order || 0).run();

  return json({ ok: true, id: result.meta.last_row_id });
}
