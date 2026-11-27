// Filled in after deploying the feedback Worker (docs/feedback-form.md, steps 4–5).
// While either value is empty, feedback.html falls back to the GitHub issue links.
export const feedbackConfig = {
  // e.g. 'https://jbc-speech-feedback.<your-subdomain>.workers.dev/feedback'
  workerUrl: '',
  // Turnstile widget site key (public by design; the secret key lives only in the Worker)
  turnstileSiteKey: ''
};
