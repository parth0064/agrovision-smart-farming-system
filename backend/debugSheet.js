const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- DEBUG START ---');
console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
console.log('Sheet ID:', process.env.GOOGLE_SHEET_ID);
console.log('Private Key Found:', !!process.env.GOOGLE_PRIVATE_KEY);

if (!process.env.GOOGLE_PRIVATE_KEY) {
  console.error('CRITICAL: Private Key is missing!');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function debugSheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  try {
    console.log('Attempting to fetch spreadsheet metadata...');
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('SUCCESS!');
    console.log('Spreadsheet Title:', res.data.properties.title);
    console.log('Sheets found:');
    res.data.sheets.forEach(s => {
      console.log(`- ${s.properties.title} (ID: ${s.properties.sheetId})`);
    });
  } catch (err) {
    console.error('API Error:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Full Error:', err);
    }
  }
}

debugSheet().then(() => console.log('--- DEBUG END ---'));
