// Pure helpers for the feedback Worker: validate a form submission and turn it into a GitHub issue.
// No Cloudflare APIs here, so tests/feedback.test.mjs can run them under Node.

export const LIMITS = { title: 120, details: 5000, extra: 2000, short: 120 };
export const INSTALL_METHODS = ['Installer (this PC)', 'Online installer', 'IT deployment', 'Word on the web', 'Not sure'];

const clean = (value, max) => typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';

/**
 * Checks a submission from feedback.html.
 * Returns { ok: true, data } or { ok: false, error } (error is shown to the person),
 * or { ok: true, spam: true } when the hidden honeypot field was filled (answer as if accepted).
 */
export function validateFeedback(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'The form data was missing.' };
  if (typeof body.website === 'string' && body.website.trim()) return { ok: true, spam: true };
  const type = body.type === 'bug' ? 'bug' : body.type === 'feature' ? 'feature' : null;
  if (!type) return { ok: false, error: 'Please choose "Request a feature" or "Report a bug".' };
  const tooLong = [['title', LIMITS.title], ['details', LIMITS.details], ['extra', LIMITS.extra], ['steps', LIMITS.extra],
    ['wordVersion', LIMITS.short]].find(([key, max]) => typeof body[key] === 'string' && body[key].trim().length > max);
  if (tooLong) return { ok: false, error: `That ${tooLong[0] === 'details' ? 'description' : 'field'} is too long (${tooLong[1]} characters at most).` };
  const data = {
    type,
    title: clean(body.title, LIMITS.title),
    details: clean(body.details, LIMITS.details),
    extra: clean(body.extra, LIMITS.extra),
    steps: type === 'bug' ? clean(body.steps, LIMITS.extra) : '',
    installMethod: type === 'bug' && INSTALL_METHODS.includes(body.installMethod) ? body.installMethod : '',
    wordVersion: type === 'bug' ? clean(body.wordVersion, LIMITS.short) : ''
  };
  if (data.title.length < 3) return { ok: false, error: 'Please add a short title.' };
  if (data.details.length < 10) return { ok: false, error: 'Please describe it in a sentence or two.' };
  return { ok: true, data };
}

// Stop "@name" in someone's text from notifying a GitHub user, by putting a zero-width space after the @.
export const neutralizeMentions = text => text.replace(/@(?=[A-Za-z0-9_-])/g, '@​');

/** Builds the GitHub issue { title, body, labels } for validated form data. */
export function buildIssue(data, { now = new Date() } = {}) {
  const feature = data.type === 'feature';
  const section = (heading, text) => text ? `### ${heading}\n\n${neutralizeMentions(text)}\n` : '';
  const body = [
    `_Sent through the feedback form on the JBC Speech site, ${now.toISOString().slice(0, 10)}._\n`,
    section(feature ? 'What would you like the library to do?' : 'What happened?', data.details),
    feature ? section('How would it help?', data.extra) : section('What was expected', data.extra),
    feature ? '' : section('Steps to reproduce', data.steps),
    feature || !(data.installMethod || data.wordVersion) ? '' :
      `### Setup\n\n- How it was added: ${data.installMethod || 'not given'}\n- Word version: ${neutralizeMentions(data.wordVersion) || 'not given'}\n`
  ].filter(Boolean).join('\n');
  return {
    title: `${feature ? 'Feature' : 'Bug'}: ${neutralizeMentions(data.title)}`,
    body,
    labels: [feature ? 'enhancement' : 'bug', 'web form']
  };
}
