const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Appends a row to the Google Sheet
 * @param {Array} rowData - Array of values to append
 */
const appendRowToSheet = async (rowData) => {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!spreadsheetId || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
    console.warn('Google Sheet ID not set. Skipping sheet update.');
    return;
  }

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1', // Assumes data goes to Sheet1
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowData],
      },
    });
    console.log('Successfully appended row to Google Sheet:', response.data.updates.updatedRange);
    return response.data;
  } catch (error) {
    console.error('Error appending row to Google Sheet:', error.message);
    // Non-blocking error for the main application
  }
};

/**
 * Overwrites the sheet with a full dump of data
 * @param {Array<Array>} rows - Array of arrays (rows)
 */
const updateSheetWithAllData = async (rows) => {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!spreadsheetId || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('Google Sheet ID not set.');
  }

  try {
    // 1. Clear existing data (A1 downwards to refresh headers too)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Sheet1!A1:Z5000',
    });

    // 2. Write new rows (starting from A1)
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error updating Google Sheet with full sync:', error.message);
    throw error;
  }
};

module.exports = {
  appendRowToSheet,
  updateSheetWithAllData,
};
