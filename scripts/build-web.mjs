// Builds dist/web: the site GitHub Pages serves (see .github/workflows/pages.yml).
//   node scripts/build-web.mjs              base URL from variants.web.baseUrl
//   PAGES_BASE_URL=https://… node scripts/build-web.mjs   (the workflow passes the real Pages URL)
// Output: src/ as-is, manifest.xml pointing at the site (for IT / Microsoft 365 deployment),
// and the homepage from site/ (index.html, home.css, home.js).
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
const onlineFiles = [...(await readdir(onlineSource)).map(file => path.join(onlineSource, file)),
  path.join(project, 'installer', 'shared', 'New-WelcomeDocument.ps1')];
for (const source of onlineFiles) {
  const file = path.basename(source);
  const text = await readFile(source, 'utf8');
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
// Homepage: site/ (index.html, home.css, home.js) plus the Chart view screenshot from docs/images.
await cp(path.join(project, 'site'), out, { recursive: true });
const home = path.join(out, 'index.html');
await writeFile(home, (await readFile(home, 'utf8')).replaceAll('{{BASE_URL}}', baseUrl).replaceAll('{{VERSION}}', version));
await mkdir(path.join(out, 'img'), { recursive: true });
await cp(path.join(project, 'docs', 'images', 'wide-chart.png'), path.join(out, 'img', 'chart-view.png'));
console.log(`Built ${path.relative(project, out)} for ${baseUrl}`);
