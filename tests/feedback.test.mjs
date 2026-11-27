import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIssue, neutralizeMentions, validateFeedback } from '../worker/src/feedback.js';
import worker from '../worker/src/index.js';

const SITE = 'https://tcanterbury.github.io';
const env = { REPO: 'tcanterbury/jbc_speech', ALLOWED_ORIGINS: SITE, GITHUB_TOKEN: 'test-token', TURNSTILE_SECRET: 'test-secret' };
const feature = { type: 'feature', title: 'Add extIPA', details: 'Please add the extIPA symbols for disordered speech.', turnstileToken: 'tok' };

test('validation accepts a good request and rejects missing or oversized fields', () => {
  assert.equal(validateFeedback(feature).ok, true);
  assert.equal(validateFeedback({ ...feature, type: 'other' }).ok, false);
  assert.equal(validateFeedback({ ...feature, title: ' ' }).ok, false);
  assert.equal(validateFeedback({ ...feature, details: 'short' }).ok, false);
  assert.equal(validateFeedback({ ...feature, details: 'x'.repeat(5001) }).ok, false);
  assert.equal(validateFeedback(null).ok, false);
  assert.deepEqual(validateFeedback({ ...feature, website: 'http://spam.example' }), { ok: true, spam: true });
});

test('bug-only fields are kept for bugs and dropped for features; unknown install methods are ignored', () => {
  const bug = validateFeedback({ ...feature, type: 'bug', steps: '1. Open chart', installMethod: 'Online installer', wordVersion: '2410' }).data;
  assert.equal(bug.steps, '1. Open chart');
  assert.equal(bug.installMethod, 'Online installer');
  const feat = validateFeedback({ ...feature, steps: 'x', installMethod: 'Online installer' }).data;
  assert.equal(feat.steps, '');
  assert.equal(feat.installMethod, '');
  assert.equal(validateFeedback({ ...feature, type: 'bug', installMethod: '<script>' }).data.installMethod, '');
});

test('issues get a prefixed title, labels, and @mentions that cannot ping anyone', () => {
  const data = validateFeedback({ ...feature, type: 'bug', title: 'Ask @octocat', details: 'Inserted the wrong vowel, cc @someone', installMethod: 'IT deployment' }).data;
  const issue = buildIssue(data, { now: new Date('2026-11-27T00:00:00Z') });
  assert.equal(issue.title, 'Bug: Ask @​octocat');
  assert.deepEqual(issue.labels, ['bug', 'web form']);
  assert.ok(issue.body.includes('2026-11-27'));
  assert.ok(issue.body.includes('@​someone'));
  assert.ok(issue.body.includes('How it was added: IT deployment'));
  assert.ok(!/@[a-z]/i.test(issue.body.replace(/@​/g, '')));
  assert.equal(neutralizeMentions('email me@example.com'), 'email me@​example.com');
});

async function withFetch(handler, run) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return handler(String(url), init); };
  try { return await run(calls); } finally { globalThis.fetch = original; }
}
const post = (body, origin = SITE) => new Request('https://worker.example/feedback', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body)
});
const json = (status, payload) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

test('worker files the issue with the secret token only after the spam check passes', async () => {
  await withFetch(url => url.includes('turnstile') ? json(200, { success: true }) : json(201, { number: 42 }), async calls => {
    const response = await worker.fetch(post(feature), env);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true, number: 42 });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), SITE);
    assert.equal(calls[0].url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(calls[1].url, 'https://api.github.com/repos/tcanterbury/jbc_speech/issues');
    assert.equal(calls[1].init.headers.Authorization, 'Bearer test-token');
    const sent = JSON.parse(calls[1].init.body);
    assert.equal(sent.title, 'Feature: Add extIPA');
    assert.ok(!JSON.stringify(await (await worker.fetch(post(feature), env)).json()).includes('test-token'));
  });
});

test('worker refuses other sites, failed spam checks, and bad input without calling GitHub', async () => {
  await withFetch(url => url.includes('turnstile') ? json(200, { success: false }) : assert.fail('GitHub must not be called'), async calls => {
    assert.equal((await worker.fetch(post(feature, 'https://evil.example'), env)).status, 403);
    assert.equal((await worker.fetch(post({ ...feature, details: 'short' }), env)).status, 400);
    assert.equal((await worker.fetch(post(feature), env)).status, 403);
    assert.equal(calls.every(call => call.url.includes('turnstile')), true);
  });
  const preflight = await worker.fetch(new Request('https://worker.example/feedback', { method: 'OPTIONS', headers: { Origin: SITE } }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  assert.equal((await worker.fetch(post(feature), { ...env, GITHUB_TOKEN: '' })).status, 503);
});

test('honeypot submissions look accepted but never create an issue', async () => {
  await withFetch(url => url.includes('turnstile') ? json(200, { success: true }) : assert.fail('GitHub must not be called'), async () => {
    const response = await worker.fetch(post({ ...feature, website: 'spam' }), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
});
