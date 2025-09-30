const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCancellationSystem() {
  try {
    console.log('🧪 Probando sistema de cancelación...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Verificar estado actual de las reservas
    console.log('\n1️⃣ Verificando estado actual de las reservas...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas en reservas_usuarios: ${rows.length}`);

    if (rows.length <= 1) {
      console.log('❌ No hay reservas para probar cancelación');
      return;
    }

    // 2. Mostrar todas las reservas disponibles
    console.log('\n2️⃣ Reservas disponibles para cancelar:');
    rows.forEach((row, index) => {
      if (index > 0 && row.length >= 13) { // Saltar header
        const id = row[0];
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        if (id && userId && fecha && estado && codigoReserva) {
          console.log(`\n🔍 Reserva ${index}:`);
          console.log(`  ID: ${id}`);
          console.log(`  Usuario: ${userId}`);
          console.log(`  Fecha: ${fecha}`);
          console.log(`  Estado: ${estado}`);
          console.log(`  Código: ${codigoReserva}`);
          console.log(`  Puede cancelar: ${estado === 'confirmada' ? 'SÍ' : 'NO'}`);
        }
      }
    });

    // 3. Simular la lógica de cancelación
    console.log('\n3️⃣ Simulando lógica de cancelación...');
    
    const testReservation = rows.find((row, index) => {
      if (index > 0 && row.length >= 13) {
        const estado = row.length >= 14 ? row[10] : row[9];
        const id = row[0];
        return estado === 'confirmada' && id === 'DIG-FUTURE123';
      }
      return false;
    });

    if (!testReservation) {
      console.log('❌ No hay reservas confirmadas para probar cancelación');
      return;
    }

    const reservationId = testReservation[0];
    const userId = testReservation[1];
    const fecha = testReservation[2];
    const estado = testReservation.length >= 14 ? testReservation[10] : testReservation[9];
    
    console.log(`\n🎯 Probando cancelación de reserva: ${reservationId}`);
    console.log(`  Usuario: ${userId}`);
    console.log(`  Fecha: ${fecha}`);
    console.log(`  Estado actual: ${estado}`);

    // Verificar si se puede cancelar (24 horas antes)
    const now = new Date();
    const reservationDateTime = new Date(fecha + 'T00:00:00');
    const diffInHours = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log(`\n⏰ Verificación de tiempo:`);
    console.log(`  Fecha actual: ${now.toISOString()}`);
    console.log(`  Fecha de reserva: ${reservationDateTime.toISOString()}`);
    console.log(`  Diferencia en horas: ${diffInHours.toFixed(2)}`);
    console.log(`  Puede cancelar: ${diffInHours >= 24 ? 'SÍ' : 'NO'}`);

    if (diffInHours < 24) {
      console.log(`❌ No se puede cancelar: Solo puedes cancelar reservas con al menos 24 horas de anticipación`);
      return;
    }

    // 4. Simular la actualización en Google Sheets
    console.log('\n4️⃣ Simulando actualización en Google Sheets...');
    
    const reservationRowIndex = rows.findIndex(row => 
      row.length >= 13 && row[0] === reservationId && row[1] === userId
    );

    if (reservationRowIndex === -1) {
      console.log('❌ No se encontró la reserva');
      return;
    }

    const actualRowIndex = reservationRowIndex + 1;
    const estadoColumn = testReservation.length >= 14 ? 'K' : 'J';
    const actualizadoColumn = testReservation.length >= 14 ? 'N' : 'M';
    
    console.log(`  Fila en array: ${reservationRowIndex}`);
    console.log(`  Fila en Google Sheets: ${actualRowIndex}`);
    console.log(`  Columna de estado: ${estadoColumn}`);
    console.log(`  Columna de actualización: ${actualizadoColumn}`);

    // 5. Hacer la cancelación real
    console.log('\n5️⃣ Ejecutando cancelación real...');
    
    const nowISO = new Date().toISOString();
    
    // Actualizar estado
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `reservas_usuarios!${estadoColumn}${actualRowIndex}:${estadoColumn}${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['cancelada']],
      },
    });

    // Actualizar fecha de actualización
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `reservas_usuarios!${actualizadoColumn}${actualRowIndex}:${actualizadoColumn}${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[nowISO]],
      },
    });

    console.log('✅ Cancelación ejecutada exitosamente');

    // 6. Verificar el resultado
    console.log('\n6️⃣ Verificando resultado...');
    
    const updatedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const updatedRows = updatedResponse.data.values || [];
    const updatedReservation = updatedRows[reservationRowIndex];
    const updatedEstado = updatedReservation.length >= 14 ? updatedReservation[10] : updatedReservation[9];
    const updatedActualizado = updatedReservation.length >= 14 ? updatedReservation[13] : updatedReservation[12];

    console.log(`  Estado actualizado: ${updatedEstado}`);
    console.log(`  Fecha de actualización: ${updatedActualizado}`);
    
    if (updatedEstado === 'cancelada') {
      console.log('✅ Cancelación verificada exitosamente');
    } else {
      console.log('❌ Error: El estado no se actualizó correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCancellationSystem();
}

module.exports = { testCancellationSystem };
