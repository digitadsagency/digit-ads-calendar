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

async function testReservationsFix() {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
      return;
    }

    console.log('🔍 VERIFICANDO RESERVAS DE USUARIOS...\n');

    // Leer reservas de usuarios
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'reservas_usuarios!A:N',
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas en reservas_usuarios: ${rows.length}`);

    // Analizar cada fila
    rows.forEach((row, index) => {
      console.log(`\n🔍 Fila ${index + 1}:`);
      console.log(`  - Longitud: ${row.length}`);
      console.log(`  - ID: ${row[0]}`);
      console.log(`  - UserID: ${row[1]}`);
      console.log(`  - Fecha: ${row[2]}`);
      console.log(`  - Bloque: ${row[3]}`);
      console.log(`  - Horario: ${row[4] || 'N/A'}`);
      console.log(`  - Cliente: ${row[5] || row[4] || 'N/A'}`);
      console.log(`  - Estado: ${row.length >= 14 ? row[10] : row[9]}`);
      console.log(`  - Código: ${row.length >= 14 ? row[11] : row[10]}`);
      
      // Verificar si es una reserva válida
      if (row.length >= 13 && row[1] && row[1] !== 'userId') {
        const userId = row[1];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigo = row.length >= 14 ? row[11] : row[10];
        
        if (estado && codigo) {
          console.log(`  ✅ Reserva válida para usuario: ${userId}`);
        } else {
          console.log(`  ❌ Reserva inválida - faltan datos`);
        }
      } else {
        console.log(`  ⚠️ Fila de encabezado o datos incompletos`);
      }
    });

    // Probar la lógica de compatibilidad
    console.log('\n🧪 PROBANDO LÓGICA DE COMPATIBILIDAD...\n');
    
    const testUserId = 'USR-953460';
    const validReservations = [];
    
    rows.forEach((row, index) => {
      if (row.length >= 13 && row[1] === testUserId) {
        const id = row[0];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigo = row.length >= 14 ? row[11] : row[10];
        
        if (id && estado && codigo) {
          const reservation = {
            id: id,
            userId: row[1],
            fecha: row[2] || '',
            bloque: row[3] || 'Mañana',
            horario: row.length >= 14 ? (row[4] || '') : '',
            cliente_nombre: row.length >= 14 ? (row[5] || '') : (row[4] || ''),
            empresa_marca: row.length >= 14 ? (row[6] || '') : (row[5] || ''),
            direccion_grabacion: row.length >= 14 ? (row[7] || '') : (row[6] || ''),
            correo: row.length >= 14 ? (row[8] || '') : (row[7] || ''),
            notas: row.length >= 14 ? (row[9] || '') : (row[8] || ''),
            estado: estado,
            codigo_reserva: codigo,
            creado_en: row.length >= 14 ? (row[12] || '') : (row[11] || ''),
            actualizado_en: row.length >= 14 ? (row[13] || '') : (row[12] || ''),
          };
          
          validReservations.push(reservation);
          console.log(`✅ Reserva procesada: ${reservation.id} - ${reservation.fecha} - ${reservation.bloque} - ${reservation.estado}`);
        }
      }
    });

    console.log(`\n📊 RESULTADOS PARA USUARIO ${testUserId}:`);
    console.log(`  - Total de reservas encontradas: ${validReservations.length}`);
    console.log(`  - Reservas confirmadas: ${validReservations.filter(r => r.estado === 'confirmada').length}`);
    console.log(`  - Reservas canceladas: ${validReservations.filter(r => r.estado === 'cancelada').length}`);

    // Calcular reservas del mes actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const currentMonthReservations = validReservations.filter(reservation => {
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      if (!fecha) return false;
      
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });
    
    console.log(`  - Reservas del mes actual (${currentMonth}/${currentYear}): ${currentMonthReservations.length}`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testReservationsFix();
}

module.exports = { testReservationsFix };
