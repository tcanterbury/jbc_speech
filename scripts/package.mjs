// Builds dist/JBC-Speech-<version>.zip: a self-contained Windows install for one user.
//   npm.cmd run package
// The zip holds a portable copy of the Node runtime running this build (process.execPath),
// the src/ pages, server.mjs, a manifest for the installed copy, and the installer scripts.
// The installed copy has its own add-in ID and port, so it can sit beside the dev sideload.
import { cp, mkdir, readFile, rm, writeFile, copyFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeManifest, variants } from './manifest-variant.mjs';

const { id: INSTALLED_ADDIN_ID, port: INSTALLED_PORT } = variants.installed;
const NAME = 'JBC Speech';

const project = fileURLToPath(new URL('..', import.meta.url));
const at = (...parts) => path.join(project, ...parts);
const { version } = JSON.parse(await readFile(at('package.json'), 'utf8'));
const dist = at('dist');
const out = path.join(dist, 'JBC-Speech');
const app = path.join(out, 'app');
const zip = path.join(dist, `JBC-Speech-${version}.zip`);
const crlf = text => text.replace(/\r?\n/g, '\r\n');

if (process.platform !== 'win32') throw new Error('Package on Windows: the zip ships this machine\'s node.exe.');
await rm(out, { recursive: true, force: true });
await rm(zip, { force: true });
await mkdir(path.join(app, 'scripts'), { recursive: true });
await mkdir(path.join(app, 'node'), { recursive: true });

// App files, installed to %LOCALAPPDATA%\JBC Speech.
await cp(at('src'), path.join(app, 'src'), { recursive: true });
await copyFile(at('scripts', 'server.mjs'), path.join(app, 'scripts', 'server.mjs'));
await copyFile(process.execPath, path.join(app, 'node', 'node.exe'));
const nodeLicense = path.join(path.dirname(process.execPath), 'LICENSE');
try { await access(nodeLicense); await copyFile(nodeLicense, path.join(app, 'node', 'LICENSE')); } catch {}

const manifest = makeManifest(await readFile(at('manifest.xml'), 'utf8'), { id: INSTALLED_ADDIN_ID, baseUrl: `https://localhost:${INSTALLED_PORT}` });
await writeFile(path.join(app, 'manifest.xml'), manifest);
await writeFile(path.join(app, 'jbc-speech.json'), JSON.stringify({
  name: NAME, version, addinId: INSTALLED_ADDIN_ID, port: INSTALLED_PORT, nodeVersion: process.version,
  pfx: 'cert/localhost.pfx', passphraseFile: 'cert/passphrase.txt', log: 'server.log'
}, null, 2));
await writeFile(path.join(app, 'uninstall.ps1'), crlf(await readFile(at('installer', 'uninstall.ps1'), 'utf8')));

// Top-level files she sees after unzipping.
for (const file of ['install.ps1', 'Install JBC Speech.cmd', 'Uninstall JBC Speech.cmd', 'READ ME.txt', 'shared/New-WelcomeDocument.ps1']) {
  await writeFile(path.join(out, path.basename(file)), crlf(await readFile(at('installer', file), 'utf8')));
}
for (const script of ['install.ps1', 'uninstall.ps1', 'shared/New-WelcomeDocument.ps1']) {
  const text = await readFile(at('installer', script), 'utf8');
  if (/[^\x00-\x7F]/.test(text)) throw new Error(`${script} must stay ASCII for Windows PowerShell 5.1`);
}

// Windows' bsdtar writes zips (-a picks the format from the extension) and, unlike
// Compress-Archive, reads files that antivirus is still scanning.
const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
execFileSync(tar, ['-a', '-c', '-f', zip, '-C', dist, 'JBC-Speech'], { stdio: 'inherit' });
await access(zip);
console.log(`Built ${path.relative(project, zip)} (${NAME} ${version}, Node ${process.version}, port ${INSTALLED_PORT})`);
