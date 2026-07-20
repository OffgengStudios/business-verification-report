/**
 * Business Verification Report — backend (Google Apps Script)
 * Mastercard Foundation Associate — field data collection (Ghana)
 *
 * WHAT THIS DOES
 *  - Writes to a specific Google Sheet (SHEET_ID) and a specific Drive folder
 *    (FOLDER_ID). If either ID is left blank it falls back to finding/creating
 *    one by name (SHEET_NAME / FOLDER_NAME).
 *  - Writes the header row matching the verification report template the first
 *    time it sees an empty Sheet.
 *  - doPost(e): receives one JSON submission from the field form, uploads
 *    each photo to the folder, appends one row to the Sheet.
 *  - doGet(e): health check that ALSO initialises — opening the Web App URL
 *    once writes the header row and resolves the photo folder.
 *
 * SETUP (see README.md for full step-by-step):
 *  1. Go to https://script.google.com/create
 *  2. Delete the placeholder code, paste this whole file in.
 *  3. Click Run once (choose the `doGet` function) to trigger the Google
 *     permission prompt, and approve access to Sheets + Drive.
 *  4. Deploy > New deployment > type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *  5. Copy the Web App URL it gives you — that's what goes into the
 *     frontend's CONFIG.SCRIPT_URL.
 */

// Bind the backend to specific Drive resources by ID (most reliable — the
// script always reads/writes exactly these, regardless of name changes or
// same-named duplicates in Drive). Leave either ID blank ('') to fall back to
// the auto-create-by-name behaviour described in the README.
const SHEET_ID = '1P_2Teh6vvlHyd19PMbf0N_16tOr7EQP4dKo1vH--Fd4';
const FOLDER_ID = '1vK-niYSstcCfy6VW7U_T1A1STJCYTKlS';

const SHEET_NAME = 'Business Verification Reports';
const FOLDER_NAME = 'Business Verification Photos';

const HEADERS = [
  'S/N',
  '(Business Owner)Name',
  'Phone number',
  'Business Type',
  'Business Name',
  'StreetName',
  'Region',
  'District',
  'photo1', 'photo2', 'photo3', 'photo4', 'photo5', 'photo6',
  'Verification Status',
  'Detailed Observations',
  'Requested Date',
  'Completed Date',
  'Latitude',
  'Longitude',
  'GPS Accuracy (m)',
  'Submitted At'
];

function getOrCreateSheet_() {
  let ss;
  if (SHEET_ID) {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } else {
    const files = DriveApp.getFilesByName(SHEET_NAME);
    ss = files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(SHEET_NAME);
  }
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateFolder_() {
  if (FOLDER_ID) {
    return DriveApp.getFolderById(FOLDER_ID);
  }
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
}

/**
 * Neutralises spreadsheet formula injection. A cell value that begins with
 * =, +, -, @ (or a leading tab/CR that Sheets also treats as a formula lead)
 * is prefixed with an apostrophe so Sheets stores it as literal text instead
 * of evaluating it. Non-string values pass through untouched.
 */
function sanitizeCell_(value) {
  if (typeof value !== 'string' || value === '') return value;
  if (/^[=+\-@\t\r]/.test(value)) return "'" + value;
  return value;
}

/**
 * Saves one base64 photo to the Drive folder and returns a shareable link,
 * or '' if no photo was provided for that slot.
 */
function savePhoto_(folder, dataUrl, ownerName, slotIndex) {
  if (!dataUrl) return '';
  const match = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
  if (!match) return '';
  const mimeType = match[1];
  const base64Data = match[2];
  const ext = mimeType.split('/')[1] || 'jpg';
  const safeName = (ownerName || 'submission').replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'submission';
  const filename = `${safeName}_photo${slotIndex}_${new Date().getTime()}.${ext}`;
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function doGet(e) {
  // Health check that also initialises: touching the Sheet writes the header
  // row if it's empty, and resolves the Drive folder — so opening the Web App
  // URL once fully sets things up (matches the README's setup step).
  let init = 'ok';
  try {
    getOrCreateSheet_();
    getOrCreateFolder_();
  } catch (err) {
    init = 'error: ' + err.message;
  }
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Verification report backend is live.',
      init: init
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Serialize the read-then-append so two near-simultaneous submissions can't
  // both read the same getLastRow() and end up with duplicate S/N values.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Server busy, please retry.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet_();
    const folder = getOrCreateFolder_();

    const sn = sheet.getLastRow(); // header is row 1, so this becomes the next S/N

    const photoUrls = [1, 2, 3, 4, 5, 6].map(i =>
      savePhoto_(folder, data['photo' + i], data.ownerName, i)
    );

    sheet.appendRow([
      sn,
      sanitizeCell_(data.ownerName || ''),
      sanitizeCell_(data.phone || ''),
      sanitizeCell_(data.businessType || ''),
      sanitizeCell_(data.businessName || ''),
      sanitizeCell_(data.streetName || ''),
      sanitizeCell_(data.region || ''),
      sanitizeCell_(data.district || ''),
      photoUrls[0], photoUrls[1], photoUrls[2], photoUrls[3], photoUrls[4], photoUrls[5],
      sanitizeCell_(data.verificationStatus || ''),
      sanitizeCell_(data.observations || ''),
      sanitizeCell_(data.requestedDate || ''),
      sanitizeCell_(data.completedDate || ''),
      data.latitude || '',
      data.longitude || '',
      data.accuracyMeters || '',
      new Date()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', sn: sn }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
