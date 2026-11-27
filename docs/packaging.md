# Packaging for a single Windows PC

Visual companion: [packaging.html](packaging.html) (open it in a browser).

## Goal

Install JBC Speech as a Word add-in on one other Windows PC, entirely from local files: no public hosting, no Node install, no admin rights. Decided 2026-11-26: fully local, Windows.

## Constraint that shapes everything

A Word web add-in always loads its pane from an **HTTPS URL** named in the manifest. "Fully local" therefore means a small web server on her PC, a certificate Windows trusts for `localhost`, and the manifest registered with Word. Office.js itself still loads from Microsoft's CDN, as Microsoft requires, so Word needs internet when the pane opens.

## Pieces

| Piece | Choice | Why |
|---|---|---|
| Runtime | Portable `node.exe` copied from the build machine (`process.execPath`), with its MIT `LICENSE` | Reuses `scripts/server.mjs` unchanged. A single file, with no install or PATH changes. Node's own `https` module needs no admin rights to bind a port, unlike `HttpListener`/http.sys. |
| Server | `server.mjs --config jbc-speech.json` | Port, PFX, passphrase file and log path come from the config, with paths relative to it. The `office-addin-dev-certs` import is lazy, so no `node_modules` is needed. |
| Background start | Startup-folder shortcut runs `node.exe server.mjs --config … --background` (window minimised) | `--background` checks the port and exits if a server is already listening. Otherwise it spawns a detached, `windowsHide` child that logs to `server.log`, then exits. Scheduled tasks and VBScript were avoided: VBScript is being retired from Windows, and an S4U task needs admin. |
| Certificate | `New-SelfSignedCertificate` in `CurrentUser\My`, with SAN `localhost`, `127.0.0.1` and `::1`, server-auth EKU, valid 5 years, exported to `cert/localhost.pfx` with a random passphrase; the public cert is imported into `CurrentUser\Root` | No admin rights needed. Windows shows one "install this certificate?" prompt, which `READ ME.txt` and the installer explain. It's reused on reinstall while it has more than 60 days left. |
| Registration | `HKCU\Software\Microsoft\Office\16.0\WEF\Developer`: value name = add-in ID, data = manifest path | The same mechanism `npm run sideload` uses (`office-addin-dev-settings`). |
| Identity | Add-in ID `a1dbced0-d314-4861-a942-e242b76c0dce`, port **44391** | Different from the dev manifest (`bed7004a…`, port 3000), so both can be installed on the dev PC. |
| Uninstall | Settings → Apps entry (`HKCU\…\Uninstall\<id>`), a Start-menu shortcut, and `Uninstall JBC Speech.cmd` | All of these run `uninstall.ps1` from the install folder. It stops the server, removes the registry values, shortcuts and both copies of the certificate (matched by thumbprint), then deletes the folder. |
| Word check | Reads `ClickToRun\Configuration\VersionToReport`; requires build ≥ 15202 | SharedRuntime 1.1 is the minimum (see README). |

## Layout

```
JBC-Speech-<version>.zip
└─ JBC-Speech/
   ├─ Install JBC Speech.cmd     → powershell -ExecutionPolicy Bypass -File install.ps1
   ├─ Uninstall JBC Speech.cmd   → %LOCALAPPDATA%\JBC Speech\uninstall.ps1
   ├─ READ ME.txt
   ├─ install.ps1
   └─ app/                       → copied to %LOCALAPPDATA%\JBC Speech
      ├─ node/node.exe, LICENSE
      ├─ scripts/server.mjs
      ├─ src/…                   (the pane)
      ├─ manifest.xml            (localhost:44391, installed ID)
      ├─ jbc-speech.json         (name, version, addinId, port, cert paths, log)
      └─ uninstall.ps1
   (created at install: cert/localhost.pfx, cert/passphrase.txt, server.log)
```

## Build

`npm.cmd run package` (`scripts/package.mjs`):
- Copies the files, rewrites the manifest's URLs and ID (and fails if the rewrite didn't take), and writes the config.
- Converts the installer text files to CRLF line endings and checks the `.ps1` files are ASCII.
- Zips with Windows `tar.exe -a`. Compress-Archive failed with "file in use" while antivirus scanned the freshly written `.cmd`.

## Verified 2026-11-26

- The generated manifest passes `office-addin-manifest validate`.
- `install.ps1` and `uninstall.ps1` parse with no errors (PowerShell parser).
- The packaged `node.exe` and `server.mjs`, with a throwaway OpenSSL certificate: `--background` started one hidden server; a second `--background` exited without starting another. It served `taskpane.html`, JS and MP3 over HTTPS, returned 404 for `../package.json`, and logged its start line.
- The dev server (`npm start`) and the 15 unit tests still pass.

**Not yet run end to end:** the installer itself. It changes the certificate store and registry and shows a Windows prompt, so run it once on the dev PC first (it can sit beside the dev sideload), open Word, and use the library. Then uninstall from Settings → Apps.

## Option B: hosted on GitHub Pages (for an IT-managed PC)

Decided 2026-11-26: keep the installer, and also publish a hosted copy in case her work PC blocks local installs. A managed PC may restrict PowerShell, block programs in `%LOCALAPPDATA%`, refuse user-trusted root certificates, or block self-installed add-ins, and installing a background server there would need IT's approval anyway. The hosted copy needs none of that: IT deploys a manifest URL.

| Piece | Choice |
|---|---|
| Host | GitHub Pages at `https://tcanterbury.github.io/jbc_speech/`. The repo is made public (free Pages needs that). |
| Build | `scripts/build-web.mjs` → `dist/web`: `src/` as-is, plus `manifest.xml` (web ID `885e4b1b…`, every URL on the Pages base) and an `index.html` landing page with a browser-demo link (`taskpane.html?preview=1`). |
| Deploy | `.github/workflows/pages.yml` on push to `main`: `npm test`, then `configure-pages` (supplies the real base URL as `PAGES_BASE_URL`), build, `upload-pages-artifact`, `deploy-pages`. A custom workflow means no Jekyll processing. |
| Manifests | `scripts/manifest-variant.mjs` holds the IDs and URLs of all three copies (dev, installed, web), plus `makeManifest()`, which refuses non-HTTPS URLs and fails if any `localhost:3000` survives. Used by both build scripts; covered by `tests/manifest.test.mjs`. |
| IT handoff | `docs/IT-deployment.md`: what it is, the manifest URL, admin-center steps, requirements, permissions and data, and the audio license. |

**Online installer** (added 2026-11-26): `downloads/JBC-Speech-online.zip` on the site, about 6 KB, built by `build-web.mjs` from `installer/online/` plus the site's manifest. It copies the manifest to `%LOCALAPPDATA%\JBC Speech (online)`, adds the `WEF\Developer` registry value and a Settings → Apps entry, and checks the site is reachable. There's no server, certificate or Node, and pane updates arrive with each deploy. It's for a personal PC that can use the hosted copy. On a work PC, use IT deployment instead. For doing it without any installer, the README also documents the shared-folder catalog and Word on the web upload.

**Code signing: not used** (decided 2026-11-26). Windows marks downloaded files, and that mark triggers SmartScreen and Attachment Manager warnings. A self-signed certificate isn't trusted on her PC until it's installed there, the same chicken-and-egg problem. `.cmd` files can't carry an Authenticode signature, and the `.ps1` files run with `-ExecutionPolicy Bypass`. Instead, both READ MEs and the landing page say: right-click the zip → Properties → **Unblock** before extracting, which removes the mark. Real signing (Microsoft Trusted Signing, about $10 a month, or an OV certificate) would only pay off if the installer became a signed `.exe` or `.msi`.

One-time GitHub setup (manual): make the repo public, then **Settings → Pages → Source: GitHub Actions**. `configure-pages` fails until Pages is enabled; after that, re-run the workflow or push again.

Verified: the hosted manifest passes `office-addin-manifest validate`, and all 18 tests pass.

## Updating her copy

- **Installer:** bump `version` in `package.json` (and `<Version>` in `manifest.xml` if the manifest changed), run `npm.cmd run package`, then run the new installer on her PC. Word must be closed; the installer waits for it.
- **Hosted:** push to `main`. Pane changes go live when the workflow finishes. Manifest changes (ribbon, permissions) also need IT to update the deployment.
