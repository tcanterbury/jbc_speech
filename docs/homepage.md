# Homepage and feedback

Visual companion: [homepage.html](homepage.html) (open it in a browser).

## Homepage

`site/` (`index.html`, `home.css`, `home.js`) is the GitHub Pages homepage for SLPs, teachers and students. `scripts/build-web.mjs` copies it over `src/`, fills in `{{BASE_URL}}` and `{{VERSION}}`, and adds `img/chart-view.png` from `docs/images/wide-chart.png`.

| Section | What it does |
|---|---|
| Nav | Sticky, dark. The logo sits on a white pill. Links: Features, Chart view, Add to Word, Feedback, plus the yellow **Install** button, which jumps to `#add`. On phones (≤640 px) only Install stays. |
| Hero | Dark "chalkboard" background with a faint grid and drifting IPA glyphs. A pulsing kicker, then "Type the **sounds** of speech." with *sounds* in a yellow highlighter. Two buttons: try it in the browser, or add it to Word. |
| Live demo | A mock Word document (`Session notes.docx`, JBC Speech tab) types real transcriptions on a loop: speech /spiːtʃ/, teacher /ˈtiːtʃɚ/, phonetics, language, thank you, measure. Symbol chips type into "Your turn"; with **Sound on** they play the real Esling/House clip from `audio-map.js`. |
| Waveform | 84 bars along the bottom of the hero, shaped like syllables and animated like a voice. |
| Stats | Symbol and recording counts are computed from `symbols.js` and `audio-map.js`, so they stay accurate. |
| Features | Six cards: one click per sound, hear every symbol, the real IPA chart, search, diacritics, private by design. |
| Chart view showcase | Copy plus a framed real screenshot, linking to the browser demo in Chart view. |
| Add to Word | A full-width, exclusive accordion: online installer (open by default), IT deployment, shared folder, Word on the web. |
| Feedback band | "Help shape what comes next", linking to the GitHub issue forms. |
| Thanks | Esling & House, the IPA, Microsoft · Node.js · Unicode · SIL, linking to Credits & thanks. |

- **Fonts and privacy:** system fonts only, with no web fonts or trackers, so the site keeps its "nothing is sent anywhere" promise.
- **Motion:** `prefers-reduced-motion` turns off every animation.
- **Other pages:** the help, credits and feedback pages share a dark `site-bar` that matches the nav (`taskpane.css`).
- **Gotcha:** `.mini-chart i` needs an explicit width and height. With `place-items:center`, empty grid items collapse to nothing, which once left the chart card's icon blank.

## Feedback

Feature requests and bug reports go to **GitHub issues** using the templates in `.github/ISSUE_TEMPLATE/` (`feature_request.md` and `bug_report.md`, with friendly prompts). Every "Request a feature" and "Report a bug" link opens a template directly:
- the pane footer
- help
- credits
- the homepage feedback band
- the README

`feedback.html` is a short page for the nav "Feedback" link. It warns people not to include client or patient information (issues are public) and shows the two buttons plus "See what's planned". Using GitHub needs a free account.

**Tried and dropped (2026-11-27):** a site form that filed issues through a Cloudflare Worker, so people wouldn't need a GitHub account. The Worker held a fine-grained token and used a Turnstile spam check. Cloudflare's dashboard import published `site/` as static files instead of running the Worker. Rather than keep fixing the build settings, it was judged not worth the extra moving parts, and the code was removed. If it's ever revisited, the deploy must use `worker/` as the root directory, and the Worker name in `wrangler.toml` must match the dashboard. The removed code is in git history (commit `48e67fd`).
