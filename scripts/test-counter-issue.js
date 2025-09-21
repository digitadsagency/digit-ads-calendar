const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Configuración
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';

console.log('🔧 Variables de entorno:');
console.log('SPREADSHEET_ID:', SPREADSHEET_ID ? '✅ Configurado' : '❌ Faltante');
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? '✅ Configurado' : '❌ Faltante');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ Faltante');

async function testCounterIssue() {
  try {
    console.log('🔍 Investigando problema del contador de reservas...');
    
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

    // Analizar cada fila
    rows.forEach((row, index) => {
      console.log(`\n🔍 Fila ${index + 1}:`);
      console.log(`  Longitud: ${row.length}`);
      console.log(`  Contenido:`, row);
      
      if (row.length >= 13) {
        const id = row[0];
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        console.log(`  ID: ${id}`);
        console.log(`  UserID: ${userId}`);
        console.log(`  Fecha: ${fecha}`);
        console.log(`  Estado: ${estado}`);
        console.log(`  Código: ${codigoReserva}`);
        
        // Verificar si es una reserva del mes actual
        if (fecha) {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          
          const [year, month] = fecha.split('-').map(Number);
          const isCurrentMonth = year === currentYear && month === currentMonth;
          
          console.log(`  Es del mes actual: ${isCurrentMonth} (${year}-${month} vs ${currentYear}-${currentMonth})`);
          console.log(`  Es confirmada: ${estado === 'confirmada'}`);
        }
      }
    });

    // Simular la lógica del frontend
    console.log('\n🧮 Simulando lógica del frontend...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Probar con los usuarios reales que encontramos
    const testUserIds = ['USR-B0BDF6', 'USR-953460', 'USR-CE17A2'];
    
    // Probar con cada usuario
    testUserIds.forEach(testUserId => {
      const currentMonthReservations = rows.filter((row, index) => {
        if (index === 0) return false; // Saltar header
        if (row.length < 13) return false;
        
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        
        if (userId !== testUserId) return false;
        if (!fecha) return false;
        
        const [year, month] = fecha.split('-').map(Number);
        const isCurrentMonth = year === currentYear && month === currentMonth;
        const isConfirmed = estado === 'confirmada';
        
        return isCurrentMonth && isConfirmed;
      });
      
      console.log(`\n📊 Usuario ${testUserId}:`);
      console.log(`  Reservas del mes actual: ${currentMonthReservations.length}`);
      console.log('  Detalles:', currentMonthReservations.map(row => ({
        fecha: row[2],
        estado: row.length >= 14 ? row[10] : row[9],
        codigo: row.length >= 14 ? row[11] : row[10]
      })));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCounterIssue();
}

module.exports = { testCounterIssue };
