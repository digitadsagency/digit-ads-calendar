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

// Arreglar el estado de los usuarios
async function fixUserStatus() {
  try {
    console.log('🔧 Arreglando estado de usuarios...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Obtener todos los usuarios
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      console.log('ℹ️  No hay usuarios para corregir');
      return;
    }

    console.log(`📋 Encontrados ${rows.length - 1} usuarios`);

    // Procesar cada usuario (saltar header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 10) {
        const email = row[1];
        const currentStatus = row[9];
        
        console.log(`👤 Usuario: ${email}`);
        console.log(`   Estado actual: ${currentStatus}`);
        
        // Cambiar a activo si no lo está
        if (currentStatus !== 'true') {
          row[9] = 'true';
          console.log(`   ✅ Cambiado a activo`);
        } else {
          console.log(`   ℹ️  Ya está activo`);
        }
      }
    }

    // Actualizar todas las filas de una vez
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });

    console.log('✅ Estados de usuarios corregidos exitosamente');

  } catch (error) {
    console.error('❌ Error corrigiendo estados:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixUserStatus();
}

module.exports = { fixUserStatus };
