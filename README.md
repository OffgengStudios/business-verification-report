---
title: Business Verification Report
permalink: /instructions/
---

# Business Verification Report — Field Data Collection MVP

Mastercard Foundation Associate — Ghana

Repository files
- `index.html` — the field form frontend (host this on GitHub Pages)
- `README.md` — deployment and usage instructions
- `code.gs` — backend script for Google Apps Script

The backend is bound to a specific Google Sheet and Drive folder **by ID**
(set at the top of `code.gs`), so submissions always land in exactly those
two places. If you leave the IDs blank it falls back to finding/creating them
by name automatically.

---

## 1. Deploy the backend (code.gs)

1. Go to [script.google.com/create](https://script.google.com/create) (use
   the Google account that owns the target Sheet + Drive folder).
2. Delete the placeholder `myFunction() {}` code.
3. Paste in the entire contents of `code.gs`.
4. (Optional) Point it at your own Sheet/folder — see
   [Changing the target Sheet or folder](#changing-the-target-sheet-or-folder)
   below. Out of the box it's already bound to the project's Sheet + folder.
5. Rename the project (top left, "Untitled project") to something like
   `Business Verification Backend`.
6. Click **Run** (▶) with `doGet` selected in the function dropdown.
   - Google will ask you to authorize the script — click **Review
     permissions**, choose your account, click **Advanced > Go to
     [project name] (unsafe)** (this warning is normal for your own
     scripts), then **Allow**.
   - This first run **initialises**: it writes the header row into the Sheet
     (if empty) and resolves the photos folder.
7. Click **Deploy > New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: anything, e.g. "v1"
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**.
8. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/XXXXXXXX/exec`).

Test it: paste that URL into a browser tab. You should see
`{"status":"ok","message":"Verification report backend is live.","init":"ok"}`.
An `"init"` value other than `"ok"` means the Sheet/folder couldn't be
reached — check the IDs at the top of `code.gs`.

Open the Sheet — it should now have the frozen header row across all 22
columns (S/N … Submitted At).

> **Note:** After editing `code.gs` you must **redeploy** for changes to take
> effect: **Deploy > Manage deployments > Edit (pencil) > Version: New
> version > Deploy**. Re-running `doGet` alone updates the Sheet but not the
> live Web App.

### Changing the target Sheet or folder

At the top of `code.gs`:

```js
const SHEET_ID  = '...';   // the Google Sheet to write rows into
const FOLDER_ID = '...';   // the Drive folder to store photos in
```

- The Sheet **must be a native Google Sheet** — an uploaded `.xlsx` will not
  work (Apps Script can only write to native Sheets; convert via
  *File > Save as Google Sheets* first).
- Set either ID to `''` to fall back to auto-create-by-name using
  `SHEET_NAME` / `FOLDER_NAME`.

---

## 2. Connect the frontend (index.html)

1. Open `index.html` in a text editor.
2. Find this line near the top of the `<script>` block:
   ```js
   const CONFIG = {
     SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
   };
   ```
3. Replace the placeholder with the Web app URL from step 1.8.

---

## 3. Add your branding assets

Place these two files next to `index.html` (same folder):
- `logo.png` — official Mastercard Foundation logo (transparent background)
- `favicon.ico` — official Mastercard Foundation favicon

If these files are missing, the page still works fine — the logo slot and
favicon just won't show anything.

---

## 4. Host on GitHub Pages

1. Create a new GitHub repository (public, since GitHub Pages on the free
   tier needs a public repo).
2. Add `index.html`, `logo.png`, and `favicon.ico` to the repo root.
3. In the repo: **Settings > Pages > Source**, select the `main` branch and
   `/ (root)` folder, then **Save**.
4. GitHub gives you a URL like `https://<your-username>.github.io/<repo>/`
   — that's the link your field data collectors will open on their phones.

---

## 5. Test end-to-end

1. Open the GitHub Pages link on a phone.
2. Fill in the form, capture **all six photos** (they're required), submit.
3. Check the Google Sheet — a new row should appear within a few seconds,
   with photo links pointing into the Drive folder.

---

## Notes on how data is handled

- **S/N** is auto-assigned as the next Sheet row number — no manual ID
  needed.
- **Photos** — all six are **required**. The form won't submit until every
  slot is filled; empty slots are flagged and it scrolls to the first one.
  Each photo is compressed client-side (max 1280px, JPEG ~72% quality)
  before upload, then stored in the Drive folder with "anyone with the link
  can view" sharing so the links work directly from the Sheet.
- **Geolocation** is captured silently in the background (no UI shown to
  the collector) and stored in the Sheet as Latitude / Longitude / Accuracy
  columns.
- **Requested Date** and **Completed Date** are entered manually by the
  collector, not auto-stamped.
- **Region / District** are both dropdowns; District is dependent on the
  selected Region and covers all 16 regions and 261 districts of Ghana.
- **Submitted At** is stamped server-side when the row is written.
- Free-text values that begin with `=`, `+`, `-` or `@` are stored as
  literal text (guards against spreadsheet formula injection).

## UI notes

- Mobile-first single-column layout; on tablet/desktop the cards flow into
  two columns and the layout widens and centres.
- The **Submit** button is a sticky bottom bar for easy thumb reach, with
  safe-area padding for notched phones.
- Pinch-zoom is allowed and inputs render at 16px so mobile browsers don't
  force-zoom on focus.

## Known limitations of this MVP

- The Apps Script web app URL is public (anyone with the link can submit).
  That's normal for this kind of field form, but don't publish the link
  outside your data collectors.
- Very large batches of very large photos could get slow since everything
  routes through Apps Script's request size limits (~50MB per request,
  well above what 6 compressed photos need — but worth knowing if you
  later raise the compression quality).
- Concurrent submissions are serialised with a script lock, so two
  collectors submitting at the same moment get sequential S/N values with no
  data loss — but under heavy simultaneous use there can be a short queue.
