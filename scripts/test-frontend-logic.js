const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Configuración
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';

async function testFrontendLogic() {
  try {
    console.log('🔍 Probando lógica exacta del frontend...');
    
    // Configurar Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener todas las filas de reservas de usuarios
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas en Google Sheets: ${rows.length}`);

    // Simular la función getAllUserReservationsWithCancelled
    const userId = 'USR-B0BDF6'; // Usuario con 1 reserva
    const reservations = [];

    console.log(`\n🔍 Procesando reservas para usuario: ${userId}`);

    rows.forEach((row, index) => {
      console.log(`\n🔍 Fila ${index + 1}:`);
      console.log(`  Longitud: ${row.length}`);
      
      // Compatibilidad con reservas antiguas (13 columnas) y nuevas (14 columnas)
      if ((row.length >= 13 || row.length >= 14) && row[1] === userId) {
        console.log(`  ✅ Coincide con usuario ${userId}`);
        
        // Solo procesar filas que tengan todos los datos necesarios
        const id = row[0];
        // Para reservas antiguas (13 columnas), el estado está en row[9], para nuevas (14 columnas) en row[10]
        const estado = row.length >= 14 ? row[10] : row[9];
        // Para reservas antiguas (13 columnas), el código está en row[10], para nuevas (14 columnas) en row[11]
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        console.log(`  ID: ${id}`);
        console.log(`  Estado: ${estado}`);
        console.log(`  Código: ${codigoReserva}`);
        
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
          
          console.log(`  ✅ Reserva procesada:`, {
            id: reservation.id,
            estado: reservation.estado,
            fecha: reservation.fecha,
            codigo: reservation.codigo_reserva
          });
          
          reservations.push(reservation);
        } else {
          console.log(`  ❌ Fila omitida - datos incompletos:`, {
            id: !!id,
            estado: !!estado,
            codigoReserva: !!codigoReserva
          });
        }
      } else {
        console.log(`  ❌ No coincide con usuario ${userId}`);
      }
    });

    console.log(`\n📊 Reservas finales para usuario ${userId}:`, reservations.length);
    reservations.forEach(r => {
      console.log(`  - ${r.id}: ${r.fecha} (${r.estado})`);
    });

    // Ahora simular la lógica del frontend para calcular reservas del mes actual
    console.log(`\n🧮 Simulando lógica del frontend para calcular reservas del mes actual...`);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    console.log(`📅 Fecha actual: ${now.toISOString()}`);
    console.log(`📅 Año actual: ${currentYear}`);
    console.log(`📅 Mes actual: ${currentMonth}`);
    
    const currentMonthReservations = reservations.filter((reservation) => {
      console.log(`\n🔍 Analizando reserva: ${reservation.id}`);
      console.log(`  Fecha: ${reservation.fecha}`);
      console.log(`  Estado: ${reservation.estado}`);
      
      // Para reservas canceladas sin fecha, usar la fecha de actualización
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      console.log(`  Fecha a usar: ${fecha}`);
      
      if (!fecha) {
        console.log(`  ❌ Sin fecha - omitir`);
        return false;
      }
      
      const [year, month] = fecha.split('-').map(Number);
      console.log(`  Año de reserva: ${year}`);
      console.log(`  Mes de reserva: ${month}`);
      console.log(`  Es del año actual: ${year === currentYear}`);
      console.log(`  Es del mes actual: ${month === currentMonth}`);
      console.log(`  Es confirmada: ${reservation.estado === 'confirmada'}`);
      
      const isCurrentMonth = year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
      console.log(`  ✅ Incluir en contador: ${isCurrentMonth}`);
      
      return isCurrentMonth;
    });
    
    console.log(`\n📊 Resultado final:`);
    console.log(`  Total de reservas: ${reservations.length}`);
    console.log(`  Reservas del mes actual: ${currentMonthReservations.length}`);
    console.log(`  Detalles:`, currentMonthReservations.map(r => ({ 
      id: r.id, 
      fecha: r.fecha, 
      estado: r.estado 
    })));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testFrontendLogic();
}

module.exports = { testFrontendLogic };
