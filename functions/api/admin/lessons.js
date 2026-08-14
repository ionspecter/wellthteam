import { json } from '../../_auth.js';

// POST /api/admin/lessons  { course_id, title, youtube_id, duration?, sort_order? }
// youtube_id is the 11-char code from the unlisted video's URL,
// e.g. https://youtu.be/dQw4w9WgXcQ  ->  "dQw4w9WgXcQ"
export async function onRequestPost({ request, env }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (!adminKey || adminKey !== env.ADMIN_KEY) return json({ error: 'Unauthorized' }, 401);

  const { course_id, title, youtube_id, duration, sort_order } = await request.json().catch(() => ({}));
  if (!course_id || !title || !youtube_id) {
    return json({ error: 'course_id, title, and youtube_id are required' }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO lessons (course_id, title, youtube_id, duration, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(course_id, title.trim(), youtube_id.trim(), duration || null, sort_order || 0).run();

  return json({ ok: true, id: result.meta.last_row_id });
}
