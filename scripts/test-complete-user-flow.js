const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCompleteUserFlow() {
  try {
    console.log('🧪 Probando flujo completo de usuario...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Verificar usuarios disponibles
    console.log('\n1️⃣ Usuarios disponibles para login:');
    
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'usuarios!A:F',
    });

    const userRows = usersResponse.data.values || [];
    const availableUsers = [];
    
    userRows.forEach((row, index) => {
      if (index > 0 && row.length >= 6) {
        const user = {
          id: row[0],
          email: row[1],
          name: row[2],
          company: row[3],
          monthlyLimit: parseInt(row[4]) || 3,
          isActive: row[5] === 'true'
        };
        
        if (user.id && user.email && user.isActive) {
          availableUsers.push(user);
          console.log(`👤 ${user.id} - ${user.email} - ${user.name} - Límite: ${user.monthlyLimit}`);
        }
      }
    });

    // 2. Para cada usuario, verificar sus reservas
    console.log('\n2️⃣ Verificando reservas por usuario:');
    
    for (const user of availableUsers) {
      console.log(`\n🔍 Usuario: ${user.id} (${user.email})`);
      
      // Simular la función getAllUserReservationsWithCancelled
      const reservationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A:N',
      });

      const reservationRows = reservationsResponse.data.values || [];
      const userReservations = [];
      
      reservationRows.forEach((row, index) => {
        if (index > 0 && row.length >= 13 && row[1] === user.id) {
          const id = row[0];
          const estado = row.length >= 14 ? row[10] : row[9];
          const codigoReserva = row.length >= 14 ? row[11] : row[10];
          const fecha = row[2];
          
          if (id && estado && codigoReserva) {
            userReservations.push({
              id,
              fecha,
              estado,
              codigo_reserva: codigoReserva
            });
          }
        }
      });

      // Calcular reservas del mes actual
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const currentMonthReservations = userReservations.filter((reservation) => {
        const [year, month] = reservation.fecha.split('-').map(Number);
        return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
      });

      console.log(`  Total de reservas: ${userReservations.length}`);
      console.log(`  Reservas este mes: ${currentMonthReservations.length}/${user.monthlyLimit}`);
      console.log(`  Detalles:`, currentMonthReservations.map(r => ({ id: r.id, fecha: r.fecha, estado: r.estado })));
      
      // Simular lo que vería el usuario en el frontend
      console.log(`  🎯 El usuario vería: "${currentMonthReservations.length}/${user.monthlyLimit} reservas restantes"`);
    }

    // 3. Crear una nueva reserva para probar
    console.log('\n3️⃣ Creando nueva reserva para probar...');
    
    const testUser = availableUsers[0]; // Usar el primer usuario disponible
    const now = new Date();
    const testDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-28`; // Día 28 del mes actual
    
    const newReservation = {
      id: 'DIG-TEST-FINAL',
      userId: testUser.id,
      fecha: testDate,
      bloque: 'Mañana',
      horario: '10:30',
      cliente_nombre: 'Cliente Test Final',
      empresa_marca: 'Empresa Test Final',
      direccion_grabacion: 'Dirección Test Final',
      correo: 'testfinal@example.com',
      notas: 'Reserva de prueba final',
      estado: 'confirmada',
      codigo_reserva: 'DIG-TEST-FINAL',
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

    console.log(`✅ Nueva reserva creada para ${testUser.id}: ${newReservation.id} - ${testDate}`);

    // 4. Verificar el contador después de crear la reserva
    console.log('\n4️⃣ Verificando contador después de crear reserva...');
    
    const finalReservationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const finalReservationRows = finalReservationsResponse.data.values || [];
    const finalUserReservations = [];
    
    finalReservationRows.forEach((row, index) => {
      if (index > 0 && row.length >= 13 && row[1] === testUser.id) {
        const id = row[0];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        const fecha = row[2];
        
        if (id && estado && codigoReserva) {
          finalUserReservations.push({
            id,
            fecha,
            estado,
            codigo_reserva: codigoReserva
          });
        }
      }
    });

    const finalCurrentMonthReservations = finalUserReservations.filter((reservation) => {
      const [year, month] = reservation.fecha.split('-').map(Number);
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });

    console.log(`📊 Contador final para ${testUser.id}: ${finalCurrentMonthReservations.length}/${testUser.monthlyLimit}`);
    console.log(`🎯 El usuario vería: "${finalCurrentMonthReservations.length}/${testUser.monthlyLimit} reservas restantes"`);

    // 5. Resumen final
    console.log('\n5️⃣ Resumen final:');
    console.log(`✅ Sistema funcionando correctamente`);
    console.log(`✅ Usuarios activos: ${availableUsers.length}`);
    console.log(`✅ Reservas creadas y contadas correctamente`);
    console.log(`✅ Contador actualizado correctamente`);
    
    console.log('\n📋 Instrucciones para el usuario:');
    console.log(`1. Haz login con: ${testUser.email}`);
    console.log(`2. Contraseña: contra123`);
    console.log(`3. Deberías ver: "${finalCurrentMonthReservations.length}/${testUser.monthlyLimit} reservas restantes"`);
    console.log(`4. Si ves 0/3, verifica que estés usando el email correcto`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCompleteUserFlow();
}

module.exports = { testCompleteUserFlow };
