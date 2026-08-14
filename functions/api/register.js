import { hashPassword, json } from '../_auth.js';

// This is deliberately NOT public signup. You add members yourself (or via a
// tiny admin form) by sending your ADMIN_KEY. Nobody can create their own account.
export async function onRequestPost({ request, env }) {
  const adminKey = request.headers.get('X-Admin-Key');
  if (!adminKey || adminKey !== env.ADMIN_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { name, email, password, tier, reseller_tag } = await request.json().catch(() => ({}));
  if (!name || !email || !password) {
    return json({ error: 'name, email, and password are required' }, 400);
  }

  const db = env.DB;
  const existing = await db.prepare('SELECT id FROM members WHERE email = ?')
    .bind(email.trim().toLowerCase()).first();
  if (existing) return json({ error: 'A member with that email already exists' }, 409);

  const { hash, salt } = await hashPassword(password);

  await db.prepare(
    `INSERT INTO members (name, email, password_hash, password_salt, tier, reseller_tag)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    name.trim(),
    email.trim().toLowerCase(),
    hash,
    salt,
    tier || 'standard',
    reseller_tag || null
  ).run();

  return json({ ok: true });
}
