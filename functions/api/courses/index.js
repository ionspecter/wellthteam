import { getMemberFromRequest, json } from '../../_auth.js';

export async function onRequestGet({ request, env }) {
  const member = await getMemberFromRequest(request, env.DB);
  if (!member) return json({ error: 'Not logged in' }, 401);

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.title, c.description, c.thumbnail,
            COUNT(l.id) AS lesson_count
     FROM courses c
     LEFT JOIN lessons l ON l.course_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.id ASC`
  ).all();

  return json({ courses: results });
}
