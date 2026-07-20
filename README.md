# Business Verification Report — Field Data Collection MVP

Mastercard Foundation Associate — Ghana

Two files:
- `index.html` — the field form (host this on GitHub Pages)
- `code.gs` — the backend (paste into Google Apps Script)

No manual Google Sheet or Drive folder setup needed — the script creates
both automatically the first time it runs.

---

## 1. Deploy the backend (code.gs)

1. Go to [script.google.com/create](https://script.google.com/create) (use
   the Google account you want the Sheet + Drive folder to live in).
2. Delete the placeholder `myFunction() {}` code.
3. Paste in the entire contents of `code.gs`.
4. Rename the project (top left, "Untitled project") to something like
   `Business Verification Backend`.
5. Click **Run** (▶) with `doGet` selected in the function dropdown.
   - Google will ask you to authorize the script — click **Review
     permissions**, choose your account, click **Advanced > Go to
     [project name] (unsafe)** (this warning is normal for your own
     scripts), then **Allow**.
   - This first run creates the Sheet and Drive folder in your account.
6. Click **Deploy > New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: anything, e.g. "v1"
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**.
7. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/XXXXXXXX/exec`).

Test it: paste that URL into a browser tab. You should see
`{"status":"ok","message":"Verification report backend is live."}`.

Check your Google Drive — you should now see:
- A Sheet named **Business Verification Reports**
- A folder named **Business Verification Photos**

---

## 2. Connect the frontend (index.html)

1. Open `index.html` in a text editor.
2. Find this line near the top of the `<script>` block:
   ```js
   const CONFIG = {
     SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
   };
   ```
3. Replace the placeholder with the Web app URL from step 1.7.

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
2. Fill in the form, capture a photo or two, submit.
3. Check the Google Sheet — a new row should appear within a few seconds,
   with photo links pointing into the Drive folder.

---

## Notes on how data is handled

- **S/N** is auto-assigned as the next Sheet row number — no manual ID
  needed.
- **Photos** are compressed client-side (max 1280px, JPEG ~70% quality)
  before upload, to keep things fast on weaker field connections, then
  uploaded to the Drive folder with "anyone with the link can view" sharing
  so the links work directly from the Sheet.
- **Geolocation** is captured silently in the background (no UI shown to
  the collector) and stored in the Sheet as Latitude / Longitude / Accuracy
  columns.
- **Requested Date** and **Completed Date** are entered manually by the
  collector, not auto-stamped.
- **Region / District** are both dropdowns; District is dependent on the
  selected Region and covers all 16 regions and 261 districts of Ghana.

## Known limitations of this MVP

- The Apps Script web app URL is public (anyone with the link can submit).
  That's normal for this kind of field form, but don't publish the link
  outside your data collectors.
- Very large batches of very large photos could get slow since everything
  routes through Apps Script's request size limits (~50MB per request,
  well above what 6 compressed photos need — but worth knowing if you
  later raise the compression quality).
- If two collectors submit in the exact same second, Apps Script serializes
  requests, so no data is lost, but there can be a short queue under heavy
  simultaneous use.
