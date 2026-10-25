/**
 * RSVP receiver for the wedding site.
 *
 * Bound to a Google Sheet (Extensions → Apps Script). Deploy as a Web app:
 *   Execute as: Me   |   Who has access: Anyone
 * Each form submission becomes one row on the "RSVPs" tab.
 */

var SHEET_NAME = 'RSVPs';
var NOTIFY_EMAIL = '';   // optional: an address to email on every RSVP (leave '' to disable)
var HEADERS = ['Timestamp', 'Name', 'Email', 'Attending', 'Party size', 'Guest names', 'Dietary notes', 'Song request', 'Message'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);

    // Honeypot: real guests never fill this hidden field.
    if (data.website) return json_({ result: 'success' });

    var name = clean_(data.name, 120);
    var email = clean_(data.email, 160);
    var attending = data.attending === 'yes' ? 'Yes' : data.attending === 'no' ? 'No' : '';
    if (!name || !attending) return json_({ result: 'error', error: 'Missing required fields' });

    var party = attending === 'Yes' ? Math.max(1, Math.min(20, parseInt(data.partySize, 10) || 1)) : 0;

    var sheet = sheet_();
    sheet.appendRow([
      new Date(),
      name,
      email,
      attending,
      party,
      attending === 'Yes' ? clean_(data.guestNames, 1000) : '',
      attending === 'Yes' ? clean_(data.dietary, 500) : '',
      attending === 'Yes' ? clean_(data.song, 200) : '',
      clean_(data.message, 2000)
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'New RSVP: ' + name + ' (' + attending + ')',
        name + ' replied ' + attending + (party ? ' for ' + party : '') + '.\n\nSee the sheet for details.');
    }
    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, so you can confirm the deployment works.
function doGet() {
  return json_({ result: 'ok', message: 'RSVP endpoint is live. Submit the form on the website to add a row.' });
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Trim, cap length, and neutralise spreadsheet formulas (=, +, -, @) so guest input can't run as a formula.
function clean_(value, max) {
  var s = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
