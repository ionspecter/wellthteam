import { verifyPassword, createSession, sessionCookie, json } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) return json({ error: 'Email and password required' }, 400);

  const db = env.DB;
  const member = await db.prepare(
    'SELECT id, name, email, password_hash, password_salt, active FROM members WHERE email = ?'
  ).bind(email.trim().toLowerCase()).first();

  if (!member || !member.active) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const ok = await verifyPassword(password, member.password_hash, member.password_salt);
  if (!ok) return json({ error: 'Invalid email or password' }, 401);

  const { token, expires } = await createSession(db, member.id);

  return json(
    { ok: true, name: member.name },
    200,
    { 'Set-Cookie': sessionCookie(token, expires) }
  );
}
