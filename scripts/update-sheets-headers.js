const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Configuración de autenticación
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// Obtener instancia de Sheets API
async function getSheets() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Headers actualizados
const RESERVAS_HEADERS = [
  'id', 'fecha', 'bloque', 'horario', 'cliente_nombre', 'empresa_marca', 'direccion_grabacion', 
  'correo', 'notas', 'estado', 'codigo_reserva', 'gcal_event_id_ph1', 
  'gcal_event_id_ph2', 'creado_en', 'actualizado_en'
];

const USER_RESERVATIONS_HEADERS = [
  'id', 'userId', 'fecha', 'bloque', 'horario', 'cliente_nombre', 'empresa_marca', 
  'direccion_grabacion', 'correo', 'notas', 'estado', 'codigo_reserva', 
  'creado_en', 'actualizado_en'
];

async function updateSheetHeaders() {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
      return;
    }

    console.log('🔄 Actualizando headers de Google Sheets...');

    // Actualizar headers de reservas públicas
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'reservas!A1:O1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [RESERVAS_HEADERS],
        },
      });
      console.log('✅ Headers de reservas públicas actualizados');
    } catch (error) {
      console.log('⚠️ No se pudo actualizar headers de reservas públicas:', error.message);
    }

    // Actualizar headers de reservas de usuarios
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'reservas_usuarios!A1:N1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [USER_RESERVATIONS_HEADERS],
        },
      });
      console.log('✅ Headers de reservas de usuarios actualizados');
    } catch (error) {
      console.log('⚠️ No se pudo actualizar headers de reservas de usuarios:', error.message);
    }

    console.log('🎉 Actualización de headers completada');
    console.log('\n📋 Nuevos headers:');
    console.log('Reservas públicas:', RESERVAS_HEADERS.join(', '));
    console.log('Reservas usuarios:', USER_RESERVATIONS_HEADERS.join(', '));

  } catch (error) {
    console.error('❌ Error actualizando headers:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateSheetHeaders();
}

module.exports = { updateSheetHeaders };
