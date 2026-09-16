import { json } from '../_auth.js';

// POST /api/rsvp — public, no login required.
// Saves one RSVP for the Mental Health Seminar (Sept 19, 2026) into D1.
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const contact = (body.contact || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const attendees = (body.attendees || '').trim();
  const source = (body.source || '').trim();
  const message = (body.message || '').trim();

  if (!name || !contact || !email || !attendees) {
    return json({ error: 'name, contact, email, and attendees are required' }, 400);
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return json({ error: 'Invalid email address' }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO mentalhealth_rsvps (name, contact, email, attendees, source, message)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(name, contact, email, attendees, source || null, message || null).run();

  return json({ ok: true });
}
