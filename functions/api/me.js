import { getMemberFromRequest, json } from '../_auth.js';

export async function onRequestGet({ request, env }) {
  const member = await getMemberFromRequest(request, env.DB);
  if (!member) return json({ error: 'Not logged in' }, 401);
  return json({
    name: member.name,
    email: member.email,
    tier: member.tier,
    reseller_tag: member.reseller_tag
  });
}
