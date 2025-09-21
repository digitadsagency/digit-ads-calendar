const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function fixMalformedReservation() {
  try {
    console.log('🔧 Arreglando reserva mal formateada...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener todas las filas
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas: ${rows.length}`);

    // Buscar la reserva problemática (DIG-B9FFFB)
    const problemRowIndex = rows.findIndex(row => row[0] === 'DIG-B9FFFB');
    
    if (problemRowIndex === -1) {
      console.log('❌ No se encontró la reserva problemática');
      return;
    }

    const problemRow = rows[problemRowIndex];
    console.log('🔍 Fila problemática encontrada:', problemRow);
    console.log(`📊 Índice de fila: ${problemRowIndex + 1}`);

    // La fila problemática tiene "cancelada" en la columna de notas (row[9]) y "confirmada" en estado (row[10])
    // Necesitamos limpiar esto y poner el estado correcto
    
    const actualRowIndex = problemRowIndex + 1; // Google Sheets usa 1-based indexing
    
    console.log('🔧 Arreglando la fila...');
    
    // Limpiar la columna de notas (columna J) - quitar "cancelada"
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!J${actualRowIndex}:J${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['']], // Limpiar la columna de notas
      },
    });

    console.log('✅ Columna de notas limpiada');

    // Verificar el estado actual
    const updatedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A${actualRowIndex}:N${actualRowIndex}`,
    });

    const updatedRow = updatedResponse.data.values[0];
    console.log('📊 Fila después de limpiar notas:', updatedRow);
    console.log(`📊 Estado actual: ${updatedRow[10]}`);
    console.log(`📊 Notas actuales: "${updatedRow[9]}"`);

    console.log('✅ Reserva arreglada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixMalformedReservation();
}

module.exports = { fixMalformedReservation };
