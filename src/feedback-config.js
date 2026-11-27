// Where the feedback form sends submissions (docs/feedback-form.md).
// While either value is empty, feedback.html falls back to the GitHub issue links.
export const feedbackConfig = {
  // The Cloudflare Worker (worker/), deployed by Workers Builds from this repo
  workerUrl: 'https://jbc-speech-word-addin.jbcspeech.workers.dev/feedback',
  // Turnstile widget site key (public by design; the secret key lives only in the Worker)
  turnstileSiteKey: '0x4AAAAAAGVQmb6mV07yLNbS'
};
