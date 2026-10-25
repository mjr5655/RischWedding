# RSVP → Google Sheet setup (about 5 minutes)

The RSVP form on the site sends each response to a small Google Apps Script, which adds a row to a Google Sheet **in your Google account**. Nothing else is involved: no third-party service, no cost.

## 1. Create the sheet
1. Go to <https://sheets.new> and name it something like **Wedding RSVPs**.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete the placeholder code, paste in everything from [`apps-script/Code.gs`](apps-script/Code.gs), and click **Save**.
3. *(Optional)* Put your email in `NOTIFY_EMAIL` at the top to get an email for every RSVP.

## 3. Deploy it as a web app
1. Click **Deploy → New deployment**, then the gear icon → **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**.
3. Google asks you to authorize: **Review permissions** → pick your account → **Advanced** → **Go to (project name) (unsafe)** → **Allow**. (It says "unsafe" only because you wrote the script yourself and Google hasn't reviewed it.)
4. Copy the **Web app URL**. It ends in `/exec`.
5. Paste that URL into your browser. You should see `{"result":"ok", ...}`. That confirms it's live.

## 4. Connect the website
In `index.html`, find this line near the bottom and paste your URL between the quotes:

```js
var RSVP_ENDPOINT = "";
```

Commit and push. Once GitHub Pages redeploys, submit a test RSVP on the site. A new row (and a bold header row, created automatically) appears on the **RSVPs** tab of your sheet. Delete your test row afterwards.

## Good to know
- **Changing the script later:** after editing `Code.gs`, use **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same. Just saving is not enough.
- **Privacy:** the sheet stays private to you. Anyone who knows the `/exec` URL can *submit* a row, but can't read anything. The script ignores spam (a hidden honeypot field), caps field lengths, and neutralises spreadsheet formulas typed into the form.
- **Columns:** Timestamp, Name, Email, Attending, Party size, Guest names, Dietary notes, Song request, Message. You can add your own columns to the right (for example, a "Meal" or "Invited" column) without breaking anything.
- **Guests' emails are stored in your sheet.** Don't share the sheet publicly.
