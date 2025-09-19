const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';

// Configuración de Google Sheets
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: SHEETS_API_VERSION, auth });
}

// Limpiar usuarios de la pestaña
async function cleanUsers() {
  try {
    console.log('🧹 Limpiando usuarios de Google Sheets...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Limpiar toda la pestaña excepto los headers
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A2:J1000`,
    });

    console.log('✅ Usuarios eliminados exitosamente');
    console.log('📋 La pestaña "usuarios" ahora solo tiene los headers');

  } catch (error) {
    console.error('❌ Error limpiando usuarios:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanUsers();
}

module.exports = { cleanUsers };
