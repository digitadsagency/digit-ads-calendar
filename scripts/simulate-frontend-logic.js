const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Simular exactamente la función getAllUserReservationsWithCancelled
async function getAllUserReservationsWithCancelled(userId) {
  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservations = [];

    console.log(`🔍 getAllUserReservationsWithCancelled - Usuario: ${userId}`);
    console.log(`🔍 Total de filas en Google Sheets: ${rows.length}`);

    rows.forEach((row, index) => {
      console.log(`🔍 Fila ${index + 1}:`, {
        length: row.length,
        userId: row[1],
        matchesUser: row[1] === userId,
        id: row[0],
        estado: row.length >= 14 ? row[10] : row[9],
        codigoReserva: row.length >= 14 ? row[11] : row[10],
        fecha: row[2]
      });

      // Compatibilidad con reservas antiguas (13 columnas) y nuevas (14 columnas)
      if ((row.length >= 13 || row.length >= 14) && row[1] === userId) {
        // Solo procesar filas que tengan todos los datos necesarios
        const id = row[0];
        // Para reservas antiguas (13 columnas), el estado está en row[9], para nuevas (14 columnas) en row[10]
        const estado = row.length >= 14 ? row[10] : row[9];
        // Para reservas antiguas (13 columnas), el código está en row[10], para nuevas (14 columnas) en row[11]
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        // Solo incluir si tiene todos los datos básicos
        if (id && estado && codigoReserva) {
          const reservation = {
            id: id,
            userId: row[1],
            fecha: row[2] || '',
            bloque: row[3] || 'Mañana',
            // Para reservas antiguas (13 columnas), no hay horario, para nuevas (14 columnas) está en row[4]
            horario: row.length >= 14 ? (row[4] || '') : '',
            // Para reservas antiguas (13 columnas), los campos están en posiciones diferentes
            cliente_nombre: row.length >= 14 ? (row[5] || '') : (row[4] || ''),
            empresa_marca: row.length >= 14 ? (row[6] || '') : (row[5] || ''),
            direccion_grabacion: row.length >= 14 ? (row[7] || '') : (row[6] || ''),
            correo: row.length >= 14 ? (row[8] || '') : (row[7] || ''),
            notas: row.length >= 14 ? (row[9] || '') : (row[8] || ''),
            estado: estado,
            codigo_reserva: codigoReserva,
            // Para reservas antiguas (13 columnas), las fechas están en row[11] y row[12]
            creado_en: row.length >= 14 ? (row[12] || '') : (row[11] || ''),
            actualizado_en: row.length >= 14 ? (row[13] || '') : (row[12] || ''),
          };
          
          console.log(`✅ Reserva procesada:`, {
            id: reservation.id,
            estado: reservation.estado,
            fecha: reservation.fecha,
            codigo: reservation.codigo_reserva
          });
          
          reservations.push(reservation);
        } else {
          console.log(`❌ Fila omitida - datos incompletos:`, {
            id: !!id,
            estado: !!estado,
            codigoReserva: !!codigoReserva
          });
        }
      }
    });

    console.log(`📊 Reservas finales para usuario ${userId}:`, reservations.map(r => ({
      id: r.id,
      estado: r.estado,
      fecha: r.fecha,
      codigo: r.codigo_reserva
    })));

    return reservations.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error obteniendo todas las reservas del usuario:', error);
    return [];
  }
}

async function simulateFrontendLogic() {
  try {
    console.log('🧪 Simulando lógica del frontend...');
    
    // 1. Simular la llamada a la API
    console.log('\n1️⃣ Simulando llamada a /api/users/reservations...');
    
    const userId = 'USR-CE17A2';
    const reservations = await getAllUserReservationsWithCancelled(userId);
    
    console.log(`📊 Respuesta de la API:`, {
      success: true,
      reservations: reservations.map(r => ({ id: r.id, fecha: r.fecha, estado: r.estado }))
    });

    // 2. Simular la lógica del frontend exactamente
    console.log('\n2️⃣ Simulando lógica del frontend...');
    
    // Calcular reservas del mes actual (solo confirmadas)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    console.log(`📅 Fecha actual: ${now.toISOString()}`);
    console.log(`📅 Año actual: ${currentYear}`);
    console.log(`📅 Mes actual: ${currentMonth}`);
    
    const currentMonthReservations = reservations.filter((reservation) => {
      // Para reservas canceladas sin fecha, usar la fecha de actualización
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      if (!fecha) return false;
      
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });
    
    console.log('📊 Reservas del mes actual:', {
      total: reservations.length,
      confirmedThisMonth: currentMonthReservations.length,
      reservations: currentMonthReservations.map((r) => ({ id: r.id, fecha: r.fecha, estado: r.estado }))
    });
    
    console.log('🔧 Estableciendo contador a:', currentMonthReservations.length);

    // 3. Simular el estado del componente
    console.log('\n3️⃣ Simulando estado del componente...');
    
    const currentMonthReservationsCount = currentMonthReservations.length;
    const monthlyLimit = 3; // Límite mensual del usuario
    
    console.log(`📊 Estado del componente:`);
    console.log(`  currentMonthReservations: ${currentMonthReservationsCount}`);
    console.log(`  monthlyLimit: ${monthlyLimit}`);
    console.log(`  Contador mostrado: ${currentMonthReservationsCount}/${monthlyLimit}`);

    // 4. Verificar si hay problemas
    console.log('\n4️⃣ Verificando posibles problemas...');
    
    if (currentMonthReservationsCount === 0) {
      console.log('❌ PROBLEMA: El contador muestra 0');
      console.log('🔍 Posibles causas:');
      console.log('  - El usuario no tiene reservas confirmadas este mes');
      console.log('  - Las reservas están en estado "cancelada"');
      console.log('  - Las fechas de las reservas no son del mes actual');
      console.log('  - El userId no coincide con el que está en Google Sheets');
    } else {
      console.log(`✅ El contador debería mostrar: ${currentMonthReservationsCount}/${monthlyLimit}`);
    }

    // 5. Debugging adicional
    console.log('\n5️⃣ Debugging adicional...');
    
    reservations.forEach((reservation, index) => {
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      const [year, month] = fecha.split('-').map(Number);
      const isCurrentMonth = year === currentYear && month === currentMonth;
      const isConfirmed = reservation.estado === 'confirmada';
      
      console.log(`🔍 Reserva ${index + 1}:`);
      console.log(`  ID: ${reservation.id}`);
      console.log(`  Fecha: ${fecha}`);
      console.log(`  Estado: ${reservation.estado}`);
      console.log(`  Es del mes actual: ${isCurrentMonth}`);
      console.log(`  Es confirmada: ${isConfirmed}`);
      console.log(`  Cuenta para límite: ${isCurrentMonth && isConfirmed}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  simulateFrontendLogic();
}

module.exports = { simulateFrontendLogic };
