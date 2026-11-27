import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const preview = process.argv.includes('--preview');
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
try {
  const server = preview ? http.createServer(serve) : https.createServer(await (await import('office-addin-dev-certs')).getHttpsServerOptions(), serve);
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(preview ? 3001 : 3000, 'localhost', () => console.log(preview ? 'Browser preview: http://localhost:3001/?preview=1' : 'JBC Speech: https://localhost:3000 — keep this terminal open while using Word.'));
} catch (error) { console.error('Could not start JBC Speech:', error.message); process.exitCode = 1; }
