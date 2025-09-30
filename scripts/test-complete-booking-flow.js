const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCompleteBookingFlow() {
  try {
    console.log('🧪 Probando flujo completo de reservas...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Limpiar reservas existentes
    console.log('\n1️⃣ Limpiando reservas existentes...');
    
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const usuariosSheet = spreadsheetInfo.data.sheets?.find(
      sheet => sheet.properties?.title === 'reservas_usuarios'
    );
    
    if (usuariosSheet?.properties?.sheetId) {
      const sheetId = usuariosSheet.properties.sheetId;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A:N',
      });
      
      const rows = response.data.values || [];
      
      if (rows.length > 1) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: 1,
                  endIndex: rows.length,
                },
              },
            }],
          },
        });
        console.log('✅ Reservas limpiadas');
      }
    }

    // 2. Crear reservas de prueba para el mes actual
    console.log('\n2️⃣ Creando reservas de prueba para el mes actual...');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Crear fechas para el mes actual
    const testDates = [
      `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, // Día 15 del mes actual
      `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`, // Día 20 del mes actual
    ];

    const testReservations = [
      {
        id: 'DIG-TEST001',
        userId: 'USR-CE17A2',
        fecha: testDates[0],
        bloque: 'Mañana',
        horario: '10:00',
        cliente_nombre: 'Cliente Test 1',
        empresa_marca: 'Empresa Test 1',
        direccion_grabacion: 'Dirección Test 1',
        correo: 'test1@example.com',
        notas: 'Reserva de prueba 1',
        estado: 'confirmada',
        codigo_reserva: 'DIG-TEST001',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      },
      {
        id: 'DIG-TEST002',
        userId: 'USR-CE17A2',
        fecha: testDates[1],
        bloque: 'Tarde',
        horario: '16:00',
        cliente_nombre: 'Cliente Test 2',
        empresa_marca: 'Empresa Test 2',
        direccion_grabacion: 'Dirección Test 2',
        correo: 'test2@example.com',
        notas: 'Reserva de prueba 2',
        estado: 'confirmada',
        codigo_reserva: 'DIG-TEST002',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }
    ];

    for (const reservation of testReservations) {
      const row = [
        reservation.id,
        reservation.userId,
        reservation.fecha,
        reservation.bloque,
        reservation.horario,
        reservation.cliente_nombre,
        reservation.empresa_marca,
        reservation.direccion_grabacion,
        reservation.correo,
        reservation.notas,
        reservation.estado,
        reservation.codigo_reserva,
        reservation.creado_en,
        reservation.actualizado_en
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A:N',
        valueInputOption: 'RAW',
        requestBody: {
          values: [row],
        },
      });

      console.log(`✅ Reserva creada: ${reservation.id} - ${reservation.fecha}`);
    }

    // 3. Verificar contador inicial
    console.log('\n3️⃣ Verificando contador inicial...');
    
    const initialResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const initialRows = initialResponse.data.values || [];
    const initialReservations = initialRows.filter((row, index) => {
      if (index > 0 && row.length >= 13) {
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        
        if (userId === 'USR-CE17A2' && estado === 'confirmada') {
          const [year, month] = fecha.split('-').map(Number);
          return year === currentYear && month === currentMonth;
        }
      }
      return false;
    });

    console.log(`📊 Contador inicial: ${initialReservations.length}/3 reservas este mes`);

    // 4. Simular cancelación de una reserva
    console.log('\n4️⃣ Simulando cancelación de una reserva...');
    
    const reservationToCancel = initialRows.find((row, index) => {
      if (index > 0 && row.length >= 13) {
        const userId = row[1];
        const estado = row.length >= 14 ? row[10] : row[9];
        return userId === 'USR-CE17A2' && estado === 'confirmada';
      }
      return false;
    });

    if (reservationToCancel) {
      const rowIndex = initialRows.indexOf(reservationToCancel) + 1;
      const estadoColumn = reservationToCancel.length >= 14 ? 'K' : 'J';
      const actualizadoColumn = reservationToCancel.length >= 14 ? 'N' : 'M';
      
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

      console.log(`✅ Reserva cancelada: ${reservationToCancel[0]}`);
    }

    // 5. Verificar contador después de cancelación
    console.log('\n5️⃣ Verificando contador después de cancelación...');
    
    const afterCancelResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const afterCancelRows = afterCancelResponse.data.values || [];
    const afterCancelReservations = afterCancelRows.filter((row, index) => {
      if (index > 0 && row.length >= 13) {
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        
        if (userId === 'USR-CE17A2' && estado === 'confirmada') {
          const [year, month] = fecha.split('-').map(Number);
          return year === currentYear && month === currentMonth;
        }
      }
      return false;
    });

    console.log(`📊 Contador después de cancelación: ${afterCancelReservations.length}/3 reservas este mes`);

    // 6. Crear una nueva reserva
    console.log('\n6️⃣ Creando nueva reserva...');
    
    const newReservation = {
      id: 'DIG-TEST003',
      userId: 'USR-CE17A2',
      fecha: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-25`,
      bloque: 'Mañana',
      horario: '11:00',
      cliente_nombre: 'Cliente Test 3',
      empresa_marca: 'Empresa Test 3',
      direccion_grabacion: 'Dirección Test 3',
      correo: 'test3@example.com',
      notas: 'Reserva de prueba 3',
      estado: 'confirmada',
      codigo_reserva: 'DIG-TEST003',
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

    // 7. Verificar contador final
    console.log('\n7️⃣ Verificando contador final...');
    
    const finalResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const finalRows = finalResponse.data.values || [];
    const finalReservations = finalRows.filter((row, index) => {
      if (index > 0 && row.length >= 13) {
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        
        if (userId === 'USR-CE17A2' && estado === 'confirmada') {
          const [year, month] = fecha.split('-').map(Number);
          return year === currentYear && month === currentMonth;
        }
      }
      return false;
    });

    console.log(`📊 Contador final: ${finalReservations.length}/3 reservas este mes`);

    // 8. Resumen del test
    console.log('\n8️⃣ Resumen del test:');
    console.log(`✅ Reservas iniciales: 2`);
    console.log(`✅ Después de cancelar 1: ${afterCancelReservations.length}`);
    console.log(`✅ Después de crear 1 nueva: ${finalReservations.length}`);
    console.log(`✅ Límite del usuario: 3`);
    
    if (finalReservations.length === 2) {
      console.log('🎉 Test completado exitosamente - El contador funciona correctamente');
    } else {
      console.log('❌ Test falló - El contador no funciona correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCompleteBookingFlow();
}

module.exports = { testCompleteBookingFlow };
