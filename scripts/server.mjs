// Serves src/ for Word (HTTPS) or the browser preview (HTTP).
//   node scripts/server.mjs              development: https://localhost:3000, Office dev certificate
//   node scripts/server.mjs --preview    browser preview: http://localhost:3001/?preview=1
//   node scripts/server.mjs --config jbc-speech.json [--background]
//                                        installed copy: port and certificate from the config file
//                                        (see scripts/package.mjs); --background starts a hidden
//                                        server unless one is already running, then exits.
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const preview = args.includes('--preview');
const configPath = option('--config') && path.resolve(option('--config'));
const config = configPath ? JSON.parse(await readFile(configPath, 'utf8')) : {};
const fromConfig = file => path.resolve(path.dirname(configPath), file);
const port = Number(config.port ?? (preview ? 3001 : 3000));

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.mp3': 'audio/mpeg' };
async function serve(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/taskpane.html' : url.pathname);
    const file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !types[path.extname(file)]) {
      res.writeHead(404).end('Not found'); return;
    }
    let content = await readFile(file);
    if (preview && path.basename(file) === 'taskpane.html') {
      content = content.toString('utf8').replace(/<script src="https:\/\/appsforoffice[^>]+><\/script>/, '');
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  } catch { res.writeHead(404).end('Not found'); }
}

function isListening() {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: 'localhost' }, () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.setTimeout(1500, () => { socket.destroy(); resolve(false); });
  });
}

async function tlsOptions() {
  if (config.pfx) {
    return { pfx: await readFile(fromConfig(config.pfx)), passphrase: (await readFile(fromConfig(config.passphraseFile), 'utf8')).trim() };
  }
  return (await import('office-addin-dev-certs')).getHttpsServerOptions();
}

const log = (...parts) => console.log(new Date().toISOString(), ...parts);

if (args.includes('--background')) {
  if (await isListening()) process.exit(0);
  const out = config.log ? openSync(fromConfig(config.log), 'a') : 'ignore';
  const childArgs = [fileURLToPath(import.meta.url), ...args.filter(arg => arg !== '--background')];
  spawn(process.execPath, childArgs, { detached: true, windowsHide: true, stdio: ['ignore', out, out] }).unref();
  process.exit(0);
}

try {
  const server = preview ? http.createServer(serve) : https.createServer(await tlsOptions(), serve);
  server.on('error', error => { log(error.message); process.exitCode = 1; });
  server.listen(port, 'localhost', () => log(preview
    ? `Browser preview: http://localhost:${port}/?preview=1`
    : `JBC Speech: https://localhost:${port} — keep this running while using Word.`));
} catch (error) { log('Could not start JBC Speech:', error.message); process.exitCode = 1; }
