import { getMemberFromRequest, json } from '../../_auth.js';

export async function onRequestGet({ request, env, params }) {
  const member = await getMemberFromRequest(request, env.DB);
  if (!member) return json({ error: 'Not logged in' }, 401);

  const courseId = params.id;

  const course = await env.DB.prepare(
    'SELECT id, title, description FROM courses WHERE id = ?'
  ).bind(courseId).first();
  if (!course) return json({ error: 'Not found' }, 404);

  const { results: lessons } = await env.DB.prepare(
    `SELECT id, title, youtube_id, duration
     FROM lessons WHERE course_id = ? ORDER BY sort_order ASC, id ASC`
  ).bind(courseId).all();

  return json({ course, lessons });
}
