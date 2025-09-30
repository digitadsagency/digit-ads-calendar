const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCancellationFlow() {
  try {
    console.log('🧪 Probando flujo completo de cancelación...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Verificar estado inicial
    console.log('\n1️⃣ Estado inicial...');
    
    const initialResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const initialRows = initialResponse.data.values || [];
    const userId = 'USR-CE17A2';
    
    const initialUserReservations = initialRows.filter((row, index) => {
      if (index > 0 && row.length >= 13 && row[1] === userId) {
        const estado = row.length >= 14 ? row[10] : row[9];
        return estado === 'confirmada';
      }
      return false;
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const initialCurrentMonthReservations = initialUserReservations.filter((row) => {
      const fecha = row[2];
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth;
    });

    console.log(`📊 Reservas confirmadas este mes: ${initialCurrentMonthReservations.length}`);

    // 2. Cancelar una reserva
    console.log('\n2️⃣ Cancelando una reserva...');
    
    if (initialCurrentMonthReservations.length > 0) {
      const reservationToCancel = initialCurrentMonthReservations[0];
      const rowIndex = initialRows.indexOf(reservationToCancel) + 1;
      const estadoColumn = reservationToCancel.length >= 14 ? 'K' : 'J';
      const actualizadoColumn = reservationToCancel.length >= 14 ? 'N' : 'M';
      
      console.log(`🎯 Cancelando reserva: ${reservationToCancel[0]} - ${reservationToCancel[2]}`);
      
      // Actualizar estado a cancelada
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `reservas_usuarios!${estadoColumn}${rowIndex}:${estadoColumn}${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['cancelada']],
        },
      });

      // Actualizar fecha de actualización
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `reservas_usuarios!${actualizadoColumn}${rowIndex}:${actualizadoColumn}${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[new Date().toISOString()]],
        },
      });

      console.log('✅ Reserva cancelada exitosamente');
    } else {
      console.log('❌ No hay reservas para cancelar');
      return;
    }

    // 3. Verificar contador después de cancelación
    console.log('\n3️⃣ Verificando contador después de cancelación...');
    
    const afterCancelResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const afterCancelRows = afterCancelResponse.data.values || [];
    
    const afterCancelUserReservations = afterCancelRows.filter((row, index) => {
      if (index > 0 && row.length >= 13 && row[1] === userId) {
        const estado = row.length >= 14 ? row[10] : row[9];
        return estado === 'confirmada';
      }
      return false;
    });

    const afterCancelCurrentMonthReservations = afterCancelUserReservations.filter((row) => {
      const fecha = row[2];
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth;
    });

    console.log(`📊 Reservas confirmadas este mes después de cancelación: ${afterCancelCurrentMonthReservations.length}`);

    // 4. Crear una nueva reserva
    console.log('\n4️⃣ Creando nueva reserva...');
    
    const newReservation = {
      id: 'DIG-TEST-AFTER-CANCEL',
      userId: userId,
      fecha: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-29`,
      bloque: 'Tarde',
      horario: '17:00',
      cliente_nombre: 'Cliente Test After Cancel',
      empresa_marca: 'Empresa Test After Cancel',
      direccion_grabacion: 'Dirección Test After Cancel',
      correo: 'testaftercancel@example.com',
      notas: 'Reserva después de cancelación',
      estado: 'confirmada',
      codigo_reserva: 'DIG-TEST-AFTER-CANCEL',
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString()
    };

    const newRow = [
      newReservation.id,
      newReservation.userId,
      newReservation.fecha,
      newReservation.bloque,
      newReservation.horario,
      newReservation.cliente_nombre,
      newReservation.empresa_marca,
      newReservation.direccion_grabacion,
      newReservation.correo,
      newReservation.notas,
      newReservation.estado,
      newReservation.codigo_reserva,
      newReservation.creado_en,
      newReservation.actualizado_en
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newRow],
      },
    });

    console.log(`✅ Nueva reserva creada: ${newReservation.id} - ${newReservation.fecha}`);

    // 5. Verificar contador final
    console.log('\n5️⃣ Verificando contador final...');
    
    const finalResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const finalRows = finalResponse.data.values || [];
    
    const finalUserReservations = finalRows.filter((row, index) => {
      if (index > 0 && row.length >= 13 && row[1] === userId) {
        const estado = row.length >= 14 ? row[10] : row[9];
        return estado === 'confirmada';
      }
      return false;
    });

    const finalCurrentMonthReservations = finalUserReservations.filter((row) => {
      const fecha = row[2];
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth;
    });

    console.log(`📊 Reservas confirmadas este mes final: ${finalCurrentMonthReservations.length}`);

    // 6. Resumen del test
    console.log('\n6️⃣ Resumen del test de cancelación:');
    console.log(`✅ Reservas iniciales: ${initialCurrentMonthReservations.length}`);
    console.log(`✅ Después de cancelar 1: ${afterCancelCurrentMonthReservations.length}`);
    console.log(`✅ Después de crear 1 nueva: ${finalCurrentMonthReservations.length}`);
    
    if (finalCurrentMonthReservations.length === initialCurrentMonthReservations.length) {
      console.log('🎉 Test de cancelación completado exitosamente');
      console.log('✅ El contador se mantiene consistente después de cancelar y crear reservas');
    } else {
      console.log('❌ Test de cancelación falló');
      console.log('❌ El contador no se mantiene consistente');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCancellationFlow();
}

module.exports = { testCancellationFlow };
