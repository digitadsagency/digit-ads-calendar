const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Simular la función getAuthenticatedUser
async function getAuthenticatedUser() {
  return {
    userId: 'USR-CE17A2',
    email: 'test@example.com'
  };
}

async function testCancellationFix() {
  try {
    console.log('🧪 Probando el sistema de cancelación arreglado...');
    
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

    // Simular el endpoint de cancelación
    const user = await getAuthenticatedUser();
    const reservationId = 'DIG-1E39EB'; // Reserva del 24 de septiembre (futura)
    
    console.log(`🔍 Intentando cancelar reserva: ${reservationId} para usuario: ${user.userId}`);

    // Obtener todas las reservas para encontrar la específica
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservationRowIndex = rows.findIndex(row => 
      row.length >= 13 && row[0] === reservationId && row[1] === user.userId
    );

    if (reservationRowIndex === -1) {
      console.log('❌ Reserva no encontrada');
      return;
    }

    const reservation = rows[reservationRowIndex];
    const reservationDate = reservation[2];
    const currentStatus = reservation.length >= 14 ? reservation[10] : reservation[9];

    console.log('🔍 Estado actual de la reserva:', {
      reservationId,
      userId: user.userId,
      currentStatus,
      reservationDate,
      rowLength: reservation.length
    });

    // Verificar si ya está cancelada
    if (currentStatus === 'cancelada') {
      console.log('❌ Reserva ya cancelada');
      return;
    }

    // Verificar si se puede cancelar (24 horas antes)
    const now = new Date();
    const reservationDateTime = new Date(reservationDate + 'T00:00:00');
    const diffInHours = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log(`⏰ Diferencia en horas: ${diffInHours.toFixed(2)}`);
    
    if (diffInHours < 24) {
      console.log('❌ No se puede cancelar - menos de 24 horas de anticipación');
      return;
    }

    console.log('✅ Se puede cancelar - procediendo...');

    // Actualizar el estado a cancelada
    const actualRowIndex = reservationRowIndex + 1;
    const nowISO = new Date().toISOString();
    
    // Determinar la columna correcta para el estado
    const estadoColumn = reservation.length >= 14 ? 'K' : 'J';
    const actualizadoColumn = reservation.length >= 14 ? 'N' : 'M';
    
    console.log('🔧 Actualizando reserva:', {
      actualRowIndex,
      estadoColumn,
      actualizadoColumn,
      newStatus: 'cancelada'
    });
    
    // Actualizar estado
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!${estadoColumn}${actualRowIndex}:${estadoColumn}${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['cancelada']],
      },
    });

    // Actualizar fecha de modificación
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!${actualizadoColumn}${actualRowIndex}:${actualizadoColumn}${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[nowISO]],
      },
    });

    console.log('✅ Reserva cancelada exitosamente');

    // Verificar el resultado
    const updatedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A${actualRowIndex}:N${actualRowIndex}`,
    });

    const updatedRow = updatedResponse.data.values[0];
    const newStatus = updatedRow.length >= 14 ? updatedRow[10] : updatedRow[9];
    
    console.log('📊 Resultado final:', {
      reservationId,
      newStatus,
      updatedAt: updatedRow.length >= 14 ? updatedRow[13] : updatedRow[12]
    });

    if (newStatus === 'cancelada') {
      console.log('🎉 ¡Cancelación exitosa!');
    } else {
      console.log('❌ Error en la cancelación');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCancellationFix();
}

module.exports = { testCancellationFix };