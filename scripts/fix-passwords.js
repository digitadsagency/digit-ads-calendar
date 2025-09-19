const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';

// Función para decodificar contraseñas en base64
function decodeBase64Password(encodedPassword) {
  try {
    return Buffer.from(encodedPassword, 'base64').toString('utf-8');
  } catch (error) {
    console.log('No es base64, devolviendo tal cual:', encodedPassword);
    return encodedPassword;
  }
}

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

// Arreglar contraseñas en Google Sheets
async function fixPasswords() {
  try {
    console.log('🔧 Iniciando corrección de contraseñas...');

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
      if (row.length >= 3) {
        const email = row[1];
        const encodedPassword = row[2];
        
        // Decodificar contraseña si está en base64
        const decodedPassword = decodeBase64Password(encodedPassword);
        
        console.log(`👤 Usuario: ${email}`);
        console.log(`   Contraseña original: ${encodedPassword}`);
        console.log(`   Contraseña decodificada: ${decodedPassword}`);
        
        // Actualizar la contraseña en la fila
        row[2] = decodedPassword;
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

    console.log('✅ Contraseñas corregidas exitosamente');
    console.log('');
    console.log('🔑 Ahora puedes usar las contraseñas tal como las escribiste originalmente');

  } catch (error) {
    console.error('❌ Error corrigiendo contraseñas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPasswords();
}

module.exports = { fixPasswords };
