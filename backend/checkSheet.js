const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function checkSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:Z5',
    });
    console.log('Sheet Content:');
    if (res.data.values) {
      res.data.values.forEach((row, i) => {
        console.log(`Row ${i}:`, row.join(' | '));
      });
    } else {
      console.log('Sheet is empty');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSheet();
