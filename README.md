# JBC Speech — Word IPA Library

A Word add-in with a **JBC Speech** ribbon tab and an **IPA Library** button. The button toggles a right-hand task pane. Inserting symbols leaves the pane open; use the same button, the pane's Hide button, or Word's close button to dismiss it. The ribbon tab itself selects ribbon controls; the button inside it toggles the pane.

It's made for **speech-language pathologists (SLPs)**, students and anyone else who transcribes speech, and we hope it's genuinely useful. It's a work in progress, so ideas and bug reports are very welcome: [request a feature](https://github.com/tcanterbury/jbc_speech/issues/new?template=feature_request.md) or [report a bug](https://github.com/tcanterbury/jbc_speech/issues/new?template=bug_report.md). It's built on generously shared work, especially Prof. John Esling and Jill House's recordings and the International Phonetic Association's IPA chart; see **With thanks** at the end.

All standard IPA categories appear together in a single scrollable view: pulmonic consonants, vowels, non-pulmonic consonants, other symbols and affricates, diacritics, suprasegmentals, and tones/word accents. Transcription brackets and several common combinations are included for convenience. Search accepts symbols, descriptive names, categories, and Unicode codes. Shift-click previews official IPA recordings where available. The separate extIPA inventory is not included.

## Run in Word on Windows

Requires Node.js 22 or newer and a supported Word installation. Microsoft documents SharedRuntime 1.1 support in Microsoft 365 Word for Windows starting at version 2205 (build 15202.10000), and in Word 2024. Word 2021 and older are not targets of this project. See [Microsoft's compatibility table](https://learn.microsoft.com/en-us/javascript/api/requirement-sets/common/shared-runtime-requirement-sets).

1. Open PowerShell in this folder and run `npm.cmd install` if dependencies are not already installed.
2. Run `npm.cmd start`. On first use, Microsoft's development certificate tool may prompt to trust a localhost certificate. This is necessary for Word to load the local HTTPS server.
3. Keep that terminal open. In a second PowerShell window in this folder, run `npm.cmd run sideload`.
4. Word should launch with the add-in registered for development. Choose **JBC Speech → IPA Library**. If needed, close and reopen Word after registration.

The source files are served directly; no build step is necessary. Stop the server with Ctrl+C. Run `npm.cmd run unsideload` to remove the development registration. Organizational Office policies may prevent sideloading; in that case an administrator must deploy the add-in.

This is the development setup: keep the server running while using the add-in. To install on another Windows PC without Node or the dev tools, see **Install on another PC** below. Pane visibility is scoped to the current document session; no automatic reopening on future Word launches is configured.

## Install on another PC (packaged)

`npm.cmd run package` builds `dist/JBC-Speech-<version>.zip` (about 38 MB). Copy it to the other PC, unzip, close Word, and double-click **Install JBC Speech.cmd**. `READ ME.txt` in the zip is written for the person installing it.

The installer runs per user, with no admin rights, and installs to `%LOCALAPPDATA%\JBC Speech`. It:

1. Checks that Word is build 15202 (version 2205) or newer.
2. Copies a portable `node.exe` (the one that ran the build), `src/`, `server.mjs` and a manifest for the installed copy.
3. Creates a self-signed `localhost` certificate in the user's store and trusts it. Windows asks the user to confirm once.
4. Adds a Startup shortcut that runs the server hidden on port 44391, and starts the server immediately.
5. Registers the manifest under `HKCU\Software\Microsoft\Office\16.0\WEF\Developer`, the same mechanism `npm run sideload` uses. Registration alone only *lists* the add-in in Word, so the installer then opens a generated **Welcome to JBC Speech.docx** that references it. Opening it adds the JBC Speech tab. A Start menu shortcut reopens it if the tab goes missing. Both installers do this.
6. Adds an uninstall entry to Settings → Apps.

Re-running a newer installer updates the files and keeps the certificate. The installed copy has its own add-in ID and port, so it can sit beside your dev sideload. Word still needs internet when the pane opens, because Office.js loads from Microsoft's CDN.

Installer sources are in `installer/`; the build script is `scripts/package.mjs`. Design notes: `docs/packaging.md`. Keep `installer/*.ps1` ASCII-only: Windows PowerShell 5.1 misreads UTF-8 without a BOM, and the build checks this.

## Hosted copy (GitHub Pages)

Every push to `main` runs `.github/workflows/pages.yml`, which runs the tests and publishes the site to **https://tcanterbury.github.io/jbc_speech/**:
- `src/` as-is;
- `manifest.xml`, pointing at the site, with its own add-in ID;
- the homepage from `site/` (`index.html`, `home.css`, `home.js`): a live typing demo with playable symbols, features, Chart view showcase, install steps and feedback;
- `feedback.html`, a short page linking to the GitHub issue forms for feature requests and bug reports, with a reminder not to include client information.

This is the option for a work PC managed by IT. Nothing is installed: IT deploys `https://tcanterbury.github.io/jbc_speech/manifest.xml` from the Microsoft 365 admin center. See `docs/IT-deployment.md`, a note written for IT. Anyone with the URL can open the site.

One-time setup on GitHub:
1. Make the repo public (Settings → General → Danger Zone → Change visibility).
2. Under Settings → Pages → Build and deployment → Source, choose **GitHub Actions**.

`npm.cmd run build:web` builds the same site locally into `dist/web`.

### Where the hosted manifest goes

- **Personal Windows PC, easiest:** the **online installer**, `https://tcanterbury.github.io/jbc_speech/downloads/JBC-Speech-online.zip` (6 KB, linked from the landing page). It saves the hosted manifest to `%LOCALAPPDATA%\JBC Speech (online)`, registers it with Word (the same registry value as `npm run sideload`) and adds a Settings → Apps uninstall entry. There's no server, certificate or Node. Sources are in `installer/online/`; `scripts/build-web.mjs` zips them with the site's manifest on every deploy.

For the routes below, download `https://tcanterbury.github.io/jbc_speech/manifest.xml` (right-click → Save link as). Menu labels vary a little between Word versions.

- **Work PC managed by IT:** IT uploads the manifest from the Microsoft 365 admin center (Settings → Integrated apps → Upload custom apps). Forward `docs/IT-deployment.md`.
- **Word on Windows, adding it yourself (shared-folder catalog):**
  1. Put `manifest.xml` in its own folder, for example `C:\JBC Speech manifest`.
  2. Share that folder: right-click it → Properties → Sharing → Share. Note the network path it shows, for example `\\HER-PC\JBC Speech manifest`.
  3. In Word, go to File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs.
  4. Paste the network path into **Catalog Url**, click **Add catalog**, tick **Show in Menu**, click OK, and restart Word.
  5. Go to Home → Add-ins → More Add-ins (or Advanced) → **SHARED FOLDER**, choose **JBC Speech**, and click **Add**.

  The catalog must be a network (`\\…`) path, not `C:\…`. Company policy can turn this setting off.
- **Word on the web:** go to Home → Add-ins → More Add-ins (or Advanced) → **MY ADD-INS** → **Upload My Add-in**, then choose `manifest.xml`. Microsoft intends this for testing, and the add-in can disappear when browser data is cleared.

The installer zip doesn't need any of this: it registers its own manifest.

There are three copies of the add-in, each with its own ID (in `scripts/manifest-variant.mjs`), so they can be installed side by side:

| Copy | Loads from | Used for |
|---|---|---|
| dev | `https://localhost:3000` | `npm start` + `npm run sideload` |
| installed | `https://localhost:44391` | The Windows installer zip |
| web | GitHub Pages | IT deployment or Word on the web |

## Insert symbols

The **Search & audio** accordion starts collapsed to leave more room for symbols. Expand it for search, category navigation, voice selection, Stop audio, and Hide. Collapsing it preserves the controls' values; a **Filter active** label reminds you when search is restricting the visible symbols.

- Click in an editable document, then click a symbol. Existing selected text is replaced. The cursor moves to the end of the inserted text so successive clicks append.
- Place the cursor immediately after a base letter before inserting a combining diacritic. Dotted circles are display aids and are never inserted.
- Insert a tie bar between the two letters it joins, or choose a prepared affricate.
- The inserted text inherits the document's font. Use an IPA-capable font such as Doulos SIL, Charis SIL, or Segoe UI if glyphs are missing.
- Tooltips and accessible button labels provide symbol names. Keyboard users can Tab to a symbol and press Enter or Space.

## List and Chart views

The **List | Chart** switch at the top of the pane changes the layout. The pane opens in List view the first time, then remembers the last choice when browser storage is available.

- **List**: the categories as symbol grids (the original layout).
- **Chart**: the symbols laid out like the IPA chart (revised to 2020). Pulmonic consonants keep the chart's rows, voiceless-left/voiced-right pairs and shaded impossible cells; vowels sit on the trapezoid; diacritics, suprasegmentals and tones show the chart's labels and examples. Library symbols that aren't on the chart (prepared affricates, ɚ ɝ ɫ, brackets) are under **Extras**.
- In a narrow pane the consonant table is split into four slices: Lips, Tongue tip & blade, Tongue body, Throat. Widen the pane to about 680 px or more to see the whole table at once.
- Clicking, Shift-click audio, tooltips and keyboard use work the same in both views. In Chart view, search dims non-matching symbols instead of reordering them, and **Jump to** scrolls to the matching chart section.

`src/chart-layout.js` holds the chart positions; `src/chart-view.js` draws them. Design notes: `docs/chart-view.md`. For a quick look in a browser, add `&view=chart` to the preview URL.

## Audio previews

Choose **J. Esling** or **J. House** in the Voice selector. A small **♪** marks symbols with a recording from that speaker. **Shift-click** plays the recording without inserting anything; a regular click still inserts. Keyboard users can use **Shift+Enter** or **Shift+Space** on a symbol button. The voice preference is remembered when browser storage is available.

Use **Stop audio** to stop playback. Starting another sound, inserting a symbol, changing voice, or hiding the pane stops the previous sound. Shift-clicking a symbol without audio displays an availability message and never inserts text. Some recordings demonstrate a symbol with syllables, words, or contrasting sounds; where there are multiple examples, they play in sequence.

Included: **244 unmodified MP3 clips, 8.61 MB total**, covering **126 library symbols** across both voices. John Esling: 125 clips for 122 symbols. Jill House: 119 clips for 117 symbols. The official map's two `025A.mp3` links return 404 and are excluded. These counts describe this download, not all audio on the source website.

Recordings are local to this project and served by the local server; listening does not contact the IPA website. Credits and the source chart's CC BY-NC-ND 4.0 terms appear in `src/audio-credits.html`, linked from the sidebar. This copy is intended for the requested personal, noncommercial use. Preserve those credits and terms with the recordings; the audio is not unrestricted material for commercial deployment.

`src/assets/audio/provenance.json` records the original URL, speaker, byte length, and SHA-256 checksum for every file. `src/audio-map.js` lists only successfully downloaded files. `node scripts/download-audio.mjs` can refresh the recordings from the official chart; it downloads only chart-listed files for the library's symbols and does not execute the site's JavaScript or modify the audio.

## Browser preview and checks

`npm.cmd run preview` serves a standalone practice view at `http://localhost:3001/?preview=1`. The practice box receives symbols instead of a Word document. Preview does not require trusting a certificate and is not evidence that Word integration works.

`npm.cmd test` checks inventory consistency, search, combining marks, insertion/cursor behavior using a Word API test double, toggle sequencing, close-event synchronization, and recovery from a failed toggle. `npm.cmd run validate` checks the Office manifest. Real Word acceptance testing is still required:

1. Open the library from the ribbon, insert several symbols, and verify the pane stays open.
2. Insert `n`, then the syllabic diacritic; verify that no dotted circle appears.
3. Select text and insert `ə`; verify replacement and that the next symbol appends.
4. Hide/reopen with the ribbon button; then close with Word's X and reopen.
5. Search for a symbol, hide/reopen the pane, and verify the search remains.
6. Repeat with two open documents to confirm per-document behavior.
7. Choose each voice and Shift-click `ə`; verify sound plays without changing document text or selection. Try a symbol without a music-note marker and verify that no text is inserted.
8. Verify Stop audio, changing voices, and hiding the sidebar stop playback.
9. Switch to Chart view, insert a consonant, a vowel and a diacritic, and Shift-click a vowel. Widen the pane past ~680 px and confirm the full consonant table replaces the four slices. Hide/reopen the pane and confirm Chart view is remembered.

Chart view (added 2026-11-26): 15 automated tests pass, including four that check the chart layout against the inventory and the 2020 chart's merged and shaded cells. Headless Edge rendered Chart view in a 320 px frame (split consonant table, vowel trapezoid fits) and a 760 px frame (full table). Inserting from Chart view uses the same button code as List view but hasn't been clicked through in Word yet.

Verified before Chart view: all 11 automated tests passed at the time, including audio-file integrity, Shift-click routing, playback sequencing, missing/error handling, and rapid playback changes. Microsoft's manifest validator passed before the audio update (the manifest is unchanged). Headless Edge rendered at a 320-pixel width without horizontal overflow, decoded and started both speakers' schwa recordings, and confirmed Shift-click left the practice text unchanged. It also verified unavailable-audio feedback. These checks do not replace listening for phonetic accuracy or testing inside Word; live Word testing remains outstanding.

The current Microsoft development tools retain five transitive npm audit findings (two high, three moderate) in the Microsoft 365 Agents Toolkit dependency tree after updating to current releases and running `npm audit fix`. These tools are development-only and are not shipped in the sidebar. Recheck upstream updates before a wider deployment; no forced dependency overrides have been applied.

## Files and references

- `manifest.xml`: Word host, permissions, JBC Speech ribbon, and shared runtime.
- `src/symbols.js`: Unicode inventory and search.
- `src/taskpane.*`: sidebar, List view and interactions.
- `src/chart-layout.js`, `src/chart-view.js`: Chart view data and rendering. `tests/chart.test.mjs` checks the chart and the inventory contain the same symbols.
- `src/word-actions.js`: Word insertion and toggle logic.
- `scripts/server.mjs`: local HTTP preview / HTTPS development server; serves only `src/`. With `--config` it runs the installed copy (port and certificate from `jbc-speech.json`); `--background` starts it hidden unless it's already running.
- `scripts/package.mjs`, `installer/`: the Windows installer zip (see **Install on another PC**).
- `scripts/build-web.mjs`, `.github/workflows/pages.yml`, `site/`: the GitHub Pages site and homepage (see **Hosted copy** and `docs/homepage.md`).
- `scripts/manifest-variant.mjs`: the IDs and URLs of all three copies.
- `src/assets/jbc_speech.png`: supplied full logo, displayed in the sidebar. The ribbon uses `jbc-icon-16.png`, `jbc-icon-32.png`, and `jbc-icon-80.png`, exported from its speech-bubble mark. Run `powershell -ExecutionPolicy Bypass -File scripts/build-icons.ps1` to regenerate these sizes; the crop rectangle is specific to this logo.

The inventory uses Unicode characters organized by phonetic properties, with the [International Phonetic Association's standard categories](https://www.internationalphoneticassociation.org/content/ipa-chart) as reference. It does not reproduce their chart artwork and is not endorsed by the Association. See Microsoft's [shared runtime setup](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/configure-your-add-in-to-use-a-shared-runtime) and [show/hide documentation](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/show-hide-add-in) for the pane behavior.

No document content is sent to an application backend. The add-in loads Microsoft's Office.js from its CDN, and local development tools have their own network requirements.

## With thanks

This project is only possible because of what others have generously shared. Heartfelt thanks to:
- **Prof. John Esling** and **Jill House**, for the IPA recordings (from the International Phonetic Association's interactive chart, CC BY-NC-ND 4.0).
- **The International Phonetic Association**, for the IPA and the IPA chart (revised to 2020, CC BY-SA 3.0), whose arrangement the Chart view follows.
- **Microsoft**, for Office.js, the Office Add-ins platform and the MIT-licensed `office-addin-*` tools.
- **The Node.js project and the OpenJS Foundation**, for Node.js (MIT), which the Windows installer includes.
- **The Unicode Consortium**, for encoding the IPA.
- **SIL International**, for the Doulos SIL and Charis SIL fonts.

The full thank-you, with license details, is `src/audio-credits.html` (shown as **Credits & thanks** in the add-in). This is an independent project and isn't endorsed by any of them.
