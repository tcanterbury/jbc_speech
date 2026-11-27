// Feedback form: posts to the Cloudflare Worker (worker/src/index.js), which files a GitHub issue.
import { feedbackConfig } from './feedback-config.js';

const form = document.getElementById('feedback-form');
const status = document.getElementById('form-status');
const thanks = document.getElementById('thanks');
const submit = form.querySelector('.submit');
const configured = Boolean(feedbackConfig.workerUrl && feedbackConfig.turnstileSiteKey);

function say(text, error = false) { status.textContent = text; status.classList.toggle('error', error); }

// ?type=bug or ?type=feature preselects the form.
const requested = new URLSearchParams(location.search).get('type');
if (requested === 'bug' || requested === 'feature') form.elements.type.value = requested;

function applyType() {
  const type = form.elements.type.value;
  form.querySelector('.bug-only').hidden = type !== 'bug';
  for (const label of form.querySelectorAll('[data-feature]')) label.textContent = label.dataset[type];
  form.elements.title.placeholder = type === 'bug' ? 'For example: Chart view cuts off the back vowels' : 'For example: Add the extIPA symbols';
}
for (const radio of form.elements.type) radio.addEventListener('change', applyType);
applyType();

if (!configured) {
  form.hidden = true;
  document.getElementById('fallback').hidden = false;
} else {
  // Turnstile (Cloudflare's free, privacy-friendly spam check) renders into #turnstile.
  window.onTurnstileLoad = () => window.turnstile.render('#turnstile', { sitekey: feedbackConfig.turnstileSiteKey, theme: 'light' });
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
  script.async = true;
  document.head.append(script);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  if (!fields.title?.trim() || (fields.details?.trim().length ?? 0) < 10) {
    say('Please add a short title and a sentence or two of description.', true); return;
  }
  const token = window.turnstile?.getResponse();
  if (!token) { say('Please complete the quick check above the Send button.', true); return; }
  submit.disabled = true;
  say('Sending…');
  try {
    const response = await fetch(feedbackConfig.workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fields, turnstileToken: token })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'Sorry, it couldn\'t be sent just now. Please try again later.');
    form.hidden = true;
    thanks.hidden = false;
    document.getElementById('thanks-detail').textContent = fields.type === 'bug'
      ? `Your bug report has been received${result.number ? ` (#${result.number})` : ''}. Thank you for helping make the library more reliable.`
      : `Your idea has been received${result.number ? ` (#${result.number})` : ''}. Thank you for helping shape what comes next.`;
    thanks.scrollIntoView({ block: 'center' });
  } catch (error) {
    say(error.message, true);
  } finally {
    submit.disabled = false;
    window.turnstile?.reset();
  }
});

document.getElementById('send-another').addEventListener('click', () => {
  form.reset();
  if (requested === 'bug' || requested === 'feature') form.elements.type.value = requested;
  applyType();
  say('');
  thanks.hidden = true;
  form.hidden = false;
});
