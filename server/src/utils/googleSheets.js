import { google } from 'googleapis';

export function isSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  );
}

export async function syncRowsToGoogleSheets(sheetName, rows) {
  if (!isSheetsConfigured()) {
    console.log("EMAIL:", process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
    console.log("KEY EXISTS:", !!process.env.GOOGLE_SHEETS_PRIVATE_KEY);
    console.log("SHEET ID:", process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    return { skipped: true, message: 'Google Sheets credentials are not configured' };

  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A1:Z1000` });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows }
  });

  return { skipped: false, rows: rows.length };
}
