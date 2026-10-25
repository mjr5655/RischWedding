/**
 * RSVP receiver for the wedding site.
 *
 * Set SPREADSHEET_ID below to your RSVP sheet. Deploy as a Web app:
 *   Execute as: Me   |   Who has access: Anyone
 * Each form submission becomes one row on the "RSVPs" tab.
 */

// The ID of the Google Sheet that should receive RSVPs: the long code in the sheet's URL,
//   https://docs.google.com/spreadsheets/d/<THIS PART>/edit
var SPREADSHEET_ID = '';
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
    console.error(String(err));   // shows up under Executions → click the row
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
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Set SPREADSHEET_ID at the top of the script.');
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

// Run this from the editor (choose "testSheet" in the dropdown, then Run) to check the setup.
// It asks for permission the first time, and logs either the sheet it will write to, or the exact problem.
function testSheet() {
  var sheet = sheet_();
  Logger.log('OK. RSVPs will be written to: ' + sheet.getParent().getUrl());
}
