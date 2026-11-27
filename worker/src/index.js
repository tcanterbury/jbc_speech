// Cloudflare Worker: receives the JBC Speech feedback form and files it as a GitHub issue.
// Secrets (set with `wrangler secret put`): GITHUB_TOKEN (fine-grained, Issues read/write on this
// repo only) and TURNSTILE_SECRET. Vars (wrangler.toml): REPO, ALLOWED_ORIGINS.
// The token never reaches the browser; the page only ever talks to this Worker.
import { buildIssue, validateFeedback } from './feedback.js';

const MAX_BODY_BYTES = 20_000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
    const allowed = allowedOrigins.includes(origin);
    const cors = allowed ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    } : { Vary: 'Origin' };
    const reply = (status, payload) => new Response(JSON.stringify(payload), {
      status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors }
    });
    const path = new URL(request.url).pathname;

    if (request.method === 'GET' && path === '/') return new Response('JBC Speech feedback endpoint.', { headers: cors });
    if (path !== '/feedback') return reply(404, { error: 'Not found.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
    if (!allowed) return reply(403, { error: 'This form can only be sent from the JBC Speech site.' });
    if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET || !env.REPO) return reply(503, { error: 'The feedback service isn\'t set up yet.' });

    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return reply(413, { error: 'That message is too long.' });
      body = JSON.parse(text);
    } catch { return reply(400, { error: 'The form data couldn\'t be read.' }); }

    const checked = validateFeedback(body);
    if (!checked.ok) return reply(400, { error: checked.error });

    // Turnstile: one token per challenge, so each submission needs a fresh human check.
    const human = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET, request.headers.get('CF-Connecting-IP'));
    if (!human) return reply(403, { error: 'The spam check didn\'t pass. Please try again.' });
    if (checked.spam) return reply(200, { ok: true });

    const issue = buildIssue(checked.data);
    const response = await fetch(`https://api.github.com/repos/${env.REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'jbc-speech-feedback-worker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issue)
    });
    if (!response.ok) {
      console.error('GitHub issue creation failed', response.status, await response.text());
      return reply(502, { error: 'Sorry, it couldn\'t be sent just now. Please try again later.' });
    }
    const created = await response.json();
    return reply(201, { ok: true, number: created.number });
  }
};

export async function verifyTurnstile(token, secret, ip) {
  if (typeof token !== 'string' || !token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    return Boolean((await result.json()).success);
  } catch { return false; }
}
