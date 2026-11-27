# JBC Speech IPA Library: deployment request

**What it is:** a Word task-pane add-in for inserting International Phonetic Alphabet symbols into documents, from a searchable side pane. It's a static web page (HTML, JavaScript, CSS, MP3 recordings of IPA sounds) hosted on GitHub Pages. Nothing is installed on the PC.

**Manifest URL:** `https://tcanterbury.github.io/jbc_speech/manifest.xml`
**Add-in ID:** `885e4b1b-0d0d-4b62-8473-24ea9c56dd56`
**Source code:** https://github.com/tcanterbury/jbc_speech

## Deploy (Microsoft 365 admin center)

1. **Settings → Integrated apps → Upload custom apps**.
2. App type: **Office Add-in**. Provide the manifest URL above, or upload the downloaded `manifest.xml`.
3. Assign it to the user who requested it, and accept the permissions.

The add-in appears as a **JBC Speech** tab in Word, with an **IPA Library** button. Deployment can take up to 24 hours to reach the client.

## Requirements

- Word for Windows, Microsoft 365 version 2205 or later, or Word 2024. Word on the web also works. The add-in uses the SharedRuntime 1.1 requirement set.
- Network access to `tcanterbury.github.io` and Microsoft's Office.js CDN (`appsforoffice.microsoft.com`).

## Security and data

| Item | Detail |
|---|---|
| Permission requested | `ReadWriteDocument`: it inserts the chosen symbol at the cursor. It doesn't read document content. |
| Network | It loads its own static files and Office.js. It makes no other requests: no analytics, no back end, and document content is never sent anywhere. |
| Storage | The browser's `localStorage` keeps two preferences: the chosen voice and the List/Chart layout. |
| Code | Plain JavaScript, with no build step and no third-party runtime libraries. The source is public at the link above. |

## Audio license

The recordings are by John Esling and Jill House, from the International Phonetic Association's interactive IPA chart. They're licensed CC BY-NC-ND 4.0 (non-commercial) and credited in the add-in. If the add-in would be used for commercial work, check whether the recordings may be used. The symbol library works without them.
