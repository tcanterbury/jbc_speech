# Feedback form and homepage

Visual companion: [feedback-form.html](feedback-form.html) (open it in a browser).

## Why

People could only send ideas and bug reports through GitHub's issue pages, which need a GitHub account and look unfamiliar to most SLPs. Decided 2026-11-27: a form on the site that files the GitHub issue itself, so people never see GitHub.

## How it works

```
feedback.html (GitHub Pages) ──POST JSON──► Cloudflare Worker ──GitHub API──► issue in tcanterbury/jbc_speech
   form + Turnstile check                     checks origin, Turnstile,          labels: enhancement|bug, web form
                                              validates, writes the issue
```

- **Why a Worker:** creating an issue needs a GitHub token. GitHub Pages is static, so a token in page code would be public. The Worker keeps the token as a Cloudflare secret.
- **Files:**
  - `worker/src/feedback.js`: pure validation (`validateFeedback`) and issue building (`buildIssue`, `neutralizeMentions`).
  - `worker/src/index.js`: the `fetch` handler, CORS, the Turnstile check, and the GitHub call.
  - `worker/wrangler.toml`: name `jbc-speech-word-addin` (must match the Worker in the Cloudflare dashboard), plus the vars `REPO` and `ALLOWED_ORIGINS`.
  - `src/feedback.html` and `src/feedback.js`: the form.
  - `src/feedback-config.js`: the Worker URL and the Turnstile **site** key. Both are public.
- **Until it's configured:** while `feedback-config.js` is empty, the form page shows the GitHub links instead, so nothing breaks before setup.
- **Links:** every "Request a feature" and "Report a bug" link (pane footer, help, credits, homepage, README) opens `https://tcanterbury.github.io/jbc_speech/feedback.html?type=feature|bug`. The links in the pane and help pages are absolute, because the installed copy serves those pages from `localhost`, which isn't an allowed origin.

## Safeguards

| Risk | Guard |
|---|---|
| Token theft | The token lives only in the Worker (`wrangler secret put GITHUB_TOKEN`). It's fine-grained, limited to **Issues: read and write** on this one repo, and expires. |
| Spam and bots | Cloudflare Turnstile on every submission (single-use tokens, verified by the Worker). There's also a hidden honeypot field, which gets a fake success and no issue. Origin allowlist: `https://tcanterbury.github.io`. Body ≤ 20 KB; title ≤ 120 characters, description ≤ 5,000, other fields ≤ 2,000. |
| Pinging strangers | `@name` becomes `@​name` (a zero-width space after the @), so mentions in submitted text don't notify anyone. |
| Patient data (SLP context) | A prominent warning on the form: issues are public, so don't include client or patient information. No email or name field. |
| Errors leaking details | People see friendly messages. GitHub's error responses are only logged to Worker observability. |

There's no per-IP rate limit; Turnstile's one-check-per-submission rule does that job. If spam ever gets through, add a Cloudflare rate-limiting rule or a Workers rate-limit binding.

## One-time setup (maintainer)

Never paste the GitHub token or the Turnstile **secret** key into chat or a file. The Worker URL and the Turnstile **site** key are public.

1. **Cloudflare account:** sign up free at dash.cloudflare.com.
2. **Turnstile widget:** in the Cloudflare dashboard, open Turnstile → Add widget.
   - Name: JBC Speech feedback.
   - Hostname: `tcanterbury.github.io`.
   - Mode: Managed.

   Create it, then keep the **site key** and the **secret key**.
3. **GitHub token:** go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
   - Name: `jbc-speech-feedback`.
   - Expiration: up to a year; set a calendar reminder.
   - Repository access: *Only select repositories* → `jbc_speech`.
   - Permissions: Repository → **Issues: Read and write**.

   Generate it and copy the token.
4. **Deploy:** the Worker `jbc-speech-word-addin` (https://jbc-speech-word-addin.jbcspeech.workers.dev) is connected to this repo through **Cloudflare Workers Builds**. In the Cloudflare dashboard, open Workers & Pages → `jbc-speech-word-addin` → Settings:
   - **Build → Build configuration:** Root directory `worker`, Build command empty, Deploy command `npx wrangler deploy`. Without the root directory, Cloudflare publishes `site/` as a plain static site instead of running the Worker.
   - **Variables and Secrets:** add `GITHUB_TOKEN` and `TURNSTILE_SECRET`, both with type **Secret**.
   - **Deployments:** retry the latest build, or push to `main`. Every push to `main` redeploys it.

   The CLI works too: from `worker/`, run `npx wrangler@4 login`, `npx wrangler@4 deploy` and `npx wrangler@4 secret put <NAME>`. If it fails with a certificate error on a work network, run it from home.
5. **Connect the form:** `src/feedback-config.js` holds `<Worker URL>/feedback` and the Turnstile site key. Both are set (2026-11-27).
6. **Test:** open the live feedback page, send a test request, and check the issue appears with the `web form` label. Then close it.

**Renewing the token:** create a new one (step 3), then run `npx wrangler@4 secret put GITHUB_TOKEN`. **Logs:** Cloudflare dashboard → Workers → `jbc-speech-feedback` → Logs.

## Homepage

`site/` (`index.html`, `home.css`, `home.js`) is the GitHub Pages homepage. `scripts/build-web.mjs` copies it over `src/`, fills in `{{BASE_URL}}` and `{{VERSION}}`, and adds `img/chart-view.png` from `docs/images/wide-chart.png`. The sections:
- **Hero:** dark "chalkboard" background with drifting IPA glyphs, a pulsing kicker, a highlighter-marked headline and an animated voice waveform.
- **Live demo:** a mock Word document types real transcriptions (*speech* /spiːtʃ/, *teacher* /ˈtiːtʃɚ/ …). Below it, symbol chips type into "Your turn" and, with Sound on, play the real Esling/House clip.
- **Stats:** computed from `symbols.js` and `audio-map.js`.
- **Then:** feature cards, a Chart view showcase, the install accordion, the feedback band and the thanks.

System fonts only, with no web fonts or trackers, so the site keeps its "nothing is sent anywhere" promise. `prefers-reduced-motion` turns off every animation. On phones (≤640 px) the nav collapses to the main button.

The help, credits and feedback pages share a dark `site-bar` that matches the homepage nav (`taskpane.css`).

## Tests

`tests/feedback.test.mjs` (6 tests) covers:
- validation limits, the honeypot and bug-only fields;
- the issue's title, labels and mention neutralizing;
- the Worker's success path with stubbed Turnstile and GitHub calls (checking the token stays server-side);
- refusing other origins, failed checks and bad input without calling GitHub;
- CORS preflight, and a 503 when the Worker isn't configured.
