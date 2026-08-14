import { getMemberFromRequest } from '../_auth.js';

// Applies automatically to every request under /members/*
// (Cloudflare Pages Functions convention: _middleware.js in a folder
// runs before any static file or function in that folder is served.)
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  // Let the login page itself through, or you'd get a redirect loop.
  if (url.pathname === '/members/login.html' || url.pathname === '/members/') {
    return next();
  }

  const member = await getMemberFromRequest(request, env.DB);
  if (!member) {
    return Response.redirect(new URL('/members/login.html', url.origin), 302);
  }

  // Stash member info on the request so downstream functions/pages could use it later if needed.
  request.member = member;
  return next();
}
