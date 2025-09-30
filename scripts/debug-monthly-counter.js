const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function debugMonthlyCounter() {
  try {
    console.log('🔍 Debugging contador mensual...');
    
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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`📅 Fecha actual: ${now.toISOString()}`);
    console.log(`📅 Año actual: ${currentYear}`);
    console.log(`📅 Mes actual: ${currentMonth}`);

    // 2. Analizar cada reserva
    console.log('\n2️⃣ Analizando cada reserva...');
    
    const reservations = [];
    const userCounts = {};

    rows.forEach((row, index) => {
      if (index > 0 && row.length >= 13) { // Saltar header
        const id = row[0];
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        if (id && userId && fecha && estado && codigoReserva) {
          const reservation = {
            id,
            userId,
            fecha,
            estado,
            codigoReserva,
            rowIndex: index + 1
          };
          
          reservations.push(reservation);
          
          // Verificar si es del mes actual
          const [year, month] = fecha.split('-').map(Number);
          const isCurrentMonth = year === currentYear && month === currentMonth;
          const isConfirmed = estado === 'confirmada';
          
          console.log(`\n🔍 Reserva ${index}:`);
          console.log(`  ID: ${id}`);
          console.log(`  Usuario: ${userId}`);
          console.log(`  Fecha: ${fecha}`);
          console.log(`  Estado: ${estado}`);
          console.log(`  Código: ${codigoReserva}`);
          console.log(`  Es del mes actual: ${isCurrentMonth}`);
          console.log(`  Es confirmada: ${isConfirmed}`);
          console.log(`  Cuenta para límite: ${isCurrentMonth && isConfirmed}`);
          
          // Contar por usuario
          if (isCurrentMonth && isConfirmed) {
            if (!userCounts[userId]) {
              userCounts[userId] = 0;
            }
            userCounts[userId]++;
          }
        }
      }
    });

    // 3. Mostrar contadores por usuario
    console.log('\n3️⃣ Contadores mensuales por usuario:');
    Object.keys(userCounts).forEach(userId => {
      console.log(`  ${userId}: ${userCounts[userId]} reservas confirmadas este mes`);
    });

    // 4. Simular la lógica del frontend
    console.log('\n4️⃣ Simulando lógica del frontend...');
    
    // Simular la función loadReservations del frontend
    const currentMonthReservations = reservations.filter((reservation) => {
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      if (!fecha) return false;
      
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });
    
    console.log(`📊 Resultado de la simulación del frontend:`);
    console.log(`  Total de reservas: ${reservations.length}`);
    console.log(`  Reservas del mes actual: ${currentMonthReservations.length}`);
    console.log(`  Detalles:`, currentMonthReservations.map(r => ({ 
      id: r.id, 
      fecha: r.fecha, 
      estado: r.estado,
      userId: r.userId
    })));

    // 5. Verificar la API de reservas de usuarios
    console.log('\n5️⃣ Verificando API de reservas de usuarios...');
    
    // Simular la función getAllUserReservationsWithCancelled
    const testUserId = 'USR-TEST123'; // Usuario de prueba
    const userReservations = reservations.filter(r => r.userId === testUserId);
    
    console.log(`📊 Reservas para usuario ${testUserId}:`);
    console.log(`  Total: ${userReservations.length}`);
    
    const userCurrentMonthReservations = userReservations.filter((reservation) => {
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      if (!fecha) return false;
      
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });
    
    console.log(`  Del mes actual: ${userCurrentMonthReservations.length}`);
    console.log(`  Detalles:`, userCurrentMonthReservations.map(r => ({ 
      id: r.id, 
      fecha: r.fecha, 
      estado: r.estado
    })));

    // 6. Resumen final
    console.log('\n6️⃣ Resumen final:');
    console.log(`📊 Total de reservas en Google Sheets: ${reservations.length}`);
    console.log(`📊 Reservas confirmadas este mes: ${Object.values(userCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`📊 Usuarios con reservas: ${Object.keys(userCounts).length}`);
    
    if (Object.values(userCounts).reduce((a, b) => a + b, 0) === 0) {
      console.log('❌ PROBLEMA: No hay reservas confirmadas este mes');
      console.log('🔍 Posibles causas:');
      console.log('  - Las reservas están en estado "cancelada"');
      console.log('  - Las reservas son de meses diferentes');
      console.log('  - Hay un problema con la lógica de filtrado');
    } else {
      console.log('✅ El contador debería funcionar correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugMonthlyCounter();
}

module.exports = { debugMonthlyCounter };
