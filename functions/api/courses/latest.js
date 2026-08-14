import { json } from '../../_auth.js';

// GET /api/courses/latest — intentionally public, no session check.
// Used by the homepage teaser section. Returns only titles/descriptions/
// counts, never lesson content or youtube_ids, so the actual videos stay
// members-only even though this endpoint is open.
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.title, c.description,
            COUNT(l.id) AS lesson_count
     FROM courses c
     LEFT JOIN lessons l ON l.course_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT 2`
  ).all();

  return json({ courses: results });
}
