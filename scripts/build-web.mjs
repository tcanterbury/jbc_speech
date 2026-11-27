// Builds dist/web: the site GitHub Pages serves (see .github/workflows/pages.yml).
//   node scripts/build-web.mjs              base URL from variants.web.baseUrl
//   PAGES_BASE_URL=https://… node scripts/build-web.mjs   (the workflow passes the real Pages URL)
// Output: src/ as-is, manifest.xml pointing at the site (for IT / Microsoft 365 deployment),
// and index.html, a landing page with a browser demo link.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeManifest, variants } from './manifest-variant.mjs';

const project = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(project, 'dist', 'web');
const baseUrl = (process.env.PAGES_BASE_URL || variants.web.baseUrl).replace(/\/+$/, '');
const { version } = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8'));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(project, 'src'), out, { recursive: true });
await writeFile(path.join(out, 'manifest.xml'),
  makeManifest(await readFile(path.join(project, 'manifest.xml'), 'utf8'), { id: variants.web.id, baseUrl }));
await writeFile(path.join(out, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>JBC Speech IPA Library</title><link rel="stylesheet" href="taskpane.css">
<style>main{max-width:640px;margin:0 auto;padding:32px 18px}h1{margin-top:24px}li{margin:8px 0;line-height:1.5}code{font-size:12px;word-break:break-all}</style>
</head><body><main>
<img src="assets/jbc_speech.png" alt="JBC Speech" width="240" style="height:auto">
<h1>IPA Library for Microsoft Word</h1>
<p>A Word add-in that inserts International Phonetic Alphabet symbols from a searchable side pane, with a List view and a Chart view laid out like the IPA chart.</p>
<ul>
<li><a href="taskpane.html?preview=1">Try it in your browser</a> (symbols go into a practice box).</li>
<li><a href="taskpane.html?preview=1&amp;view=chart">Browser demo, Chart view</a></li>
<li>Add-in manifest for Microsoft 365 deployment: <a href="manifest.xml"><code>${baseUrl}/manifest.xml</code></a></li>
<li><a href="help.html">Help</a> · <a href="audio-credits.html">Audio credits &amp; license</a></li>
</ul>
<p class="note">Version ${version}. Audio recordings by John Esling and Jill House from the International Phonetic Association's interactive chart, CC BY-NC-ND 4.0. Not endorsed by the Association.</p>
</main></body></html>
`);
console.log(`Built ${path.relative(project, out)} for ${baseUrl}`);
