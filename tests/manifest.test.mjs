import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEV_ORIGIN, makeManifest, variants } from '../scripts/manifest-variant.mjs';

const dev = await readFile(new URL('../manifest.xml', import.meta.url), 'utf8');
const devId = dev.match(/<Id>([^<]+)<\/Id>/)[1];

test('dev, installed and web copies have distinct add-in IDs', () => {
  const ids = [devId, variants.installed.id, variants.web.id];
  assert.equal(new Set(ids).size, 3);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});

test('hosted manifest points every URL at the site and nowhere else', () => {
  const urlCount = dev.split(DEV_ORIGIN).length - 1;
  assert.ok(urlCount >= 6, 'expected the dev manifest to use the dev origin throughout');
  const web = makeManifest(dev, { id: variants.web.id, baseUrl: variants.web.baseUrl + '/' });
  assert.ok(!web.includes('localhost'));
  assert.equal(web.split(`${variants.web.baseUrl}/`).length - 1, urlCount, 'a URL lost its path or gained a double slash');
  assert.ok(web.includes(`<SourceLocation DefaultValue="${variants.web.baseUrl}/taskpane.html"/>`));
  assert.ok(web.includes(`<Id>${variants.web.id}</Id>`));
});

test('manifest rewrite refuses plain HTTP', () => {
  assert.throws(() => makeManifest(dev, { id: variants.web.id, baseUrl: 'http://example.com' }));
});
