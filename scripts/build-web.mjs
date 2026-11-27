// Builds dist/web: the site GitHub Pages serves (see .github/workflows/pages.yml).
//   node scripts/build-web.mjs              base URL from variants.web.baseUrl
//   PAGES_BASE_URL=https://… node scripts/build-web.mjs   (the workflow passes the real Pages URL)
// Output: src/ as-is, manifest.xml pointing at the site (for IT / Microsoft 365 deployment),
// and index.html, a landing page with a browser demo link.
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
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
const manifest = makeManifest(await readFile(path.join(project, 'manifest.xml'), 'utf8'), { id: variants.web.id, baseUrl });
await writeFile(path.join(out, 'manifest.xml'), manifest);

// downloads/JBC-Speech-online.zip: the small installer that only registers this manifest with Word.
const stage = path.join(project, 'dist', 'online-stage');
const folder = path.join(stage, 'JBC-Speech-online');
await rm(stage, { recursive: true, force: true });
await mkdir(folder, { recursive: true });
const onlineSource = path.join(project, 'installer', 'online');
for (const file of await readdir(onlineSource)) {
  const text = await readFile(path.join(onlineSource, file), 'utf8');
  if (file.endsWith('.ps1') && /[^\x00-\x7F]/.test(text)) throw new Error(`${file} must stay ASCII for Windows PowerShell 5.1`);
  await writeFile(path.join(folder, file), text.replace(/\r?\n/g, '\r\n'));
}
await writeFile(path.join(folder, 'manifest.xml'), manifest);
await writeFile(path.join(folder, 'jbc-speech-online.json'), JSON.stringify({
  name: 'JBC Speech (online)', version, addinId: variants.web.id, siteUrl: `${baseUrl}/`, pageUrl: `${baseUrl}/taskpane.html`
}, null, 2));
const zip = path.join(out, 'downloads', 'JBC-Speech-online.zip');
await mkdir(path.dirname(zip), { recursive: true });
if (process.platform === 'win32') {
  execFileSync(path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', zip, '-C', stage, 'JBC-Speech-online']);
} else {
  execFileSync('zip', ['-r', '-q', zip, 'JBC-Speech-online'], { cwd: stage });
}
await access(zip);
await rm(stage, { recursive: true, force: true });
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
<li><a href="help.html">Help</a> · <a href="audio-credits.html">Audio credits &amp; license</a></li>
</ul>
<h2>Add it to Word</h2>
<p>The add-in's manifest file tells Word where to load it from: <a href="manifest.xml" download><code>${baseUrl}/manifest.xml</code></a> (right-click → Save link as).</p>
<ul>
<li><b>Easiest, on your own Windows PC:</b> <a href="downloads/JBC-Speech-online.zip">download the small installer</a> (a few KB). Unzip it, close Word, and double-click <b>Install JBC Speech (online).cmd</b>. Uninstall it from Settings → Apps.</li>
<li><b>Work PC managed by IT:</b> ask IT to deploy the manifest URL above from the Microsoft 365 admin center (Settings → Integrated apps → Upload custom apps).</li>
<li><b>Word on Windows, yourself:</b> put <code>manifest.xml</code> in a folder and share it (right-click → Properties → Sharing). In Word, go to File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs, add the folder's <code>\\\\PC-NAME\\folder</code> network path, tick <b>Show in Menu</b>, and restart Word. Then go to Home → Add-ins → More Add-ins → <b>Shared Folder</b> → JBC Speech → Add.</li>
<li><b>Word on the web:</b> go to Home → Add-ins → More Add-ins → <b>My Add-ins</b> → Upload My Add-in, and choose <code>manifest.xml</code>.</li>
</ul>
<p>Then choose the <b>JBC Speech</b> tab → <b>IPA Library</b>. Menu labels vary a little between Word versions.</p>
<p class="note">Version ${version}. Audio recordings by John Esling and Jill House from the International Phonetic Association's interactive chart, CC BY-NC-ND 4.0. Not endorsed by the Association.</p>
</main></body></html>
`);
console.log(`Built ${path.relative(project, out)} for ${baseUrl}`);
