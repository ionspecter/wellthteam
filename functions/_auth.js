// Shared helpers used by every function in /functions/api and /functions/members
// Pure Web Crypto — no npm deps, works natively in Cloudflare Pages Functions.

const SESSION_DAYS = 14;

// ---------- password hashing (PBKDF2-SHA256) ----------
export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex
    ? hexToBytes(saltHex)
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return {
    hash: bytesToHex(new Uint8Array(bits)),
    salt: bytesToHex(salt)
  };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  const { hash } = await hashPassword(password, storedSalt);
  return timingSafeEqual(hash, storedHash);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

// ---------- sessions ----------
export function newSessionToken() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createSession(db, memberId) {
  const token = newSessionToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(
    'INSERT INTO sessions (token, member_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, memberId, expires).run();
  return { token, expires };
}

export async function getMemberFromRequest(request, db) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)wt_session=([^;]+)/);
  if (!match) return null;
  const token = match[1];

  const row = await db.prepare(
    `SELECT m.id, m.name, m.email, m.tier, m.reseller_tag, m.active, s.expires_at
     FROM sessions s JOIN members m ON m.id = s.member_id
     WHERE s.token = ?`
  ).bind(token).first();

  if (!row) return null;
  if (!row.active) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  return row;
}

export function sessionCookie(token, expires) {
  const expiresUTC = new Date(expires).toUTCString();
  return `wt_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresUTC}`;
}

export function clearCookie() {
  return `wt_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}
