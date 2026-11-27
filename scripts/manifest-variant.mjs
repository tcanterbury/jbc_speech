// The three copies of the add-in. Each has its own ID so they can be installed side by side.
//   dev       manifest.xml as committed: https://localhost:3000 (npm start + npm run sideload)
//   installed the Windows installer zip: https://localhost:44391 (scripts/package.mjs)
//   web       GitHub Pages: deployed by .github/workflows/pages.yml (scripts/build-web.mjs)
export const DEV_ORIGIN = 'https://localhost:3000';
export const variants = {
  installed: { id: 'a1dbced0-d314-4861-a942-e242b76c0dce', port: 44391 },
  web: { id: '885e4b1b-0d0d-4b62-8473-24ea9c56dd56', baseUrl: 'https://tcanterbury.github.io/jbc_speech' }
};

/** Returns manifest.xml rewritten to load from baseUrl (no trailing slash) with a new add-in ID. */
export function makeManifest(xml, { id, baseUrl }) {
  const base = baseUrl.replace(/\/+$/, '');
  if (!/^https:\/\//.test(base)) throw new Error(`Add-in URLs must be HTTPS: ${base}`);
  const out = xml.replaceAll(DEV_ORIGIN, base).replace(/<Id>[^<]+<\/Id>/, `<Id>${id}</Id>`);
  if (out.includes('localhost:3000') || !out.includes(`<Id>${id}</Id>`)) throw new Error('Manifest rewrite failed');
  return out;
}
