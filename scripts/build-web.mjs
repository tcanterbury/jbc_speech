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
<style>
main{max-width:640px;margin:0 auto;padding:32px 18px}h1{margin-top:24px}li{margin:8px 0;line-height:1.5}code{font-size:12px;word-break:break-all}
h2.add{font-size:16px;margin:28px 0 6px;color:#183b40}
.route{border:1px solid #dce6e2;border-radius:8px;background:#fff;margin:8px 0}
.route summary{padding:12px 14px;cursor:pointer;font-weight:600;color:#31594e;list-style-position:inside}
.route summary::marker{color:#477b6c}
.route summary span{font-weight:400;color:#688079;font-size:12px;margin-left:4px}
.route[open] summary{border-bottom:1px solid #dce6e2}
.route summary:focus-visible{outline:2px solid #197565;outline-offset:2px;border-radius:7px}
.route .body{padding:4px 16px 12px}
.route ol{padding-left:20px;margin:8px 0}
.tip{font-size:12px;color:#637c74;background:#eef5f1;border-radius:6px;padding:8px 10px}
</style>
</head><body><main>
<img src="assets/jbc_speech.png" alt="JBC Speech" width="240" style="height:auto">
<h1>IPA Library for Microsoft Word</h1>
<p>A Word add-in that inserts International Phonetic Alphabet symbols from a searchable side pane, with a List view and a Chart view laid out like the IPA chart.</p>
<ul>
<li><a href="taskpane.html?preview=1">Try it in your browser</a> (symbols go into a practice box).</li>
<li><a href="taskpane.html?preview=1&amp;view=chart">Browser demo, Chart view</a></li>
<li><a href="help.html">Help</a> · <a href="audio-credits.html">Credits &amp; thanks</a></li>
</ul>
<h2 class="add">Add it to Word</h2>
<p>Choose the way that fits your computer. Afterwards, open the <b>JBC Speech</b> tab in Word and click <b>IPA Library</b>. Menu labels vary a little between Word versions.</p>

<details class="route" name="add-to-word" open>
<summary>Your own Windows PC <span>easiest · small installer</span></summary>
<div class="body"><ol>
<li><a href="downloads/JBC-Speech-online.zip">Download the installer</a> (a few KB).</li>
<li>Right-click the zip → <b>Properties</b> → tick <b>Unblock</b> → OK. This stops Windows warning about a downloaded file.</li>
<li>Right-click the zip → <b>Extract All</b>.</li>
<li>Close Word, then double-click <b>Install JBC Speech (online).cmd</b>.</li>
</ol>
<p class="tip">To remove it: Settings → Apps → Installed apps → JBC Speech (online) → … → Uninstall.</p></div>
</details>

<details class="route" name="add-to-word">
<summary>Work PC managed by IT <span>IT adds it for you</span></summary>
<div class="body"><p>Ask IT to deploy this manifest from the Microsoft 365 admin center (Settings → Integrated apps → Upload custom apps → Office Add-in):</p>
<p><code>${baseUrl}/manifest.xml</code></p>
<p class="tip">Nothing is installed on the PC. The add-in only inserts the symbols you click, and sends nothing anywhere.</p></div>
</details>

<details class="route" name="add-to-word">
<summary>Word on Windows, without an installer <span>shared folder</span></summary>
<div class="body"><ol>
<li>Save <a href="manifest.xml" download>manifest.xml</a> into a folder of its own.</li>
<li>Share the folder: right-click it → Properties → Sharing → Share. Note its network path, for example <code>\\\\PC-NAME\\folder</code>.</li>
<li>In Word, go to File → Options → Trust Center → Trust Center Settings → <b>Trusted Add-in Catalogs</b>.</li>
<li>Paste the network path into Catalog Url, click <b>Add catalog</b>, tick <b>Show in Menu</b>, click OK, and restart Word.</li>
<li>Go to Home → Add-ins → More Add-ins → <b>Shared Folder</b> → JBC Speech → Add.</li>
</ol></div>
</details>

<details class="route" name="add-to-word">
<summary>Word on the web <span>browser</span></summary>
<div class="body"><ol>
<li>Save <a href="manifest.xml" download>manifest.xml</a>.</li>
<li>In Word on the web, go to Home → Add-ins → More Add-ins → <b>My Add-ins</b> → <b>Upload My Add-in</b>, and choose the file.</li>
</ol>
<p class="tip">Microsoft intends this for testing; the add-in can disappear when browser data is cleared.</p></div>
</details>
<p class="note">Version ${version}. With heartfelt thanks to John Esling and Jill House for the recordings (from the International Phonetic Association's interactive chart, CC BY-NC-ND 4.0), and to the International Phonetic Association for the IPA chart (CC BY-SA 3.0). Everyone who made this possible is thanked on the <a href="audio-credits.html">Credits &amp; thanks</a> page. This is an independent project and isn't endorsed by them.</p>
</main></body></html>
`);
console.log(`Built ${path.relative(project, out)} for ${baseUrl}`);
