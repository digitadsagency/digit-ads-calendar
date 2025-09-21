const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Simular exactamente lo que pasa en el frontend cuando se hace refresh
async function simulateRefresh() {
  try {
    console.log('🔄 Simulando refresh del frontend...');
    
    // 1. Simular checkAuth()
    console.log('\n1️⃣ Simulando checkAuth()...');
    const user = {
      userId: 'USR-B0BDF6',
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Company',
      monthlyLimit: 2
    };
    console.log('✅ Usuario autenticado:', user.userId);
    
    // 2. Simular loadReservations()
    console.log('\n2️⃣ Simulando loadReservations()...');
    
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservations = [];

    console.log(`📊 Total de filas en Google Sheets: ${rows.length}`);

    rows.forEach((row, index) => {
      if ((row.length >= 13 || row.length >= 14) && row[1] === user.userId) {
        const id = row[0];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        if (id && estado && codigoReserva) {
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
            codigo_reserva: codigoReserva,
            creado_en: row.length >= 14 ? (row[12] || '') : (row[11] || ''),
            actualizado_en: row.length >= 14 ? (row[13] || '') : (row[12] || ''),
          };
          
          reservations.push(reservation);
        }
      }
    });

    console.log(`📊 Reservas encontradas: ${reservations.length}`);
    reservations.forEach(r => {
      console.log(`  - ${r.id}: ${r.fecha} (${r.estado})`);
    });

    // 3. Simular cálculo del contador mensual
    console.log('\n3️⃣ Simulando cálculo del contador mensual...');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    console.log(`📅 Fecha actual: ${now.toISOString()}`);
    console.log(`📅 Año actual: ${currentYear}`);
    console.log(`📅 Mes actual: ${currentMonth}`);
    
    const currentMonthReservations = reservations.filter((reservation) => {
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      if (!fecha) return false;
      
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });
    
    console.log(`📊 Reservas del mes actual: ${currentMonthReservations.length}`);
    currentMonthReservations.forEach(r => {
      console.log(`  - ${r.id}: ${r.fecha} (${r.estado})`);
    });

    // 4. Simular estado del componente
    console.log('\n4️⃣ Simulando estado del componente...');
    console.log(`🔧 currentMonthReservations se establecería a: ${currentMonthReservations.length}`);
    console.log(`🔧 user.monthlyLimit: ${user.monthlyLimit}`);
    console.log(`🔧 Contador mostraría: ${currentMonthReservations.length}/${user.monthlyLimit} reservas este mes`);

    // 5. Simular lo que pasa después de un refresh
    console.log('\n5️⃣ Simulando segundo refresh (después de crear reserva)...');
    
    // Simular que se creó una nueva reserva
    console.log('🔄 Simulando que se creó una nueva reserva...');
    
    // Volver a cargar las reservas
    const response2 = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows2 = response2.data.values || [];
    const reservations2 = [];

    console.log(`📊 Total de filas en Google Sheets (segundo refresh): ${rows2.length}`);

    rows2.forEach((row, index) => {
      if ((row.length >= 13 || row.length >= 14) && row[1] === user.userId) {
        const id = row[0];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        if (id && estado && codigoReserva) {
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
            codigo_reserva: codigoReserva,
            creado_en: row.length >= 14 ? (row[12] || '') : (row[11] || ''),
            actualizado_en: row.length >= 14 ? (row[13] || '') : (row[12] || ''),
          };
          
          reservations2.push(reservation);
        }
      }
    });

    console.log(`📊 Reservas encontradas (segundo refresh): ${reservations2.length}`);
    reservations2.forEach(r => {
      console.log(`  - ${r.id}: ${r.fecha} (${r.estado})`);
    });

    // Recalcular contador
    const currentMonthReservations2 = reservations2.filter((reservation) => {
      const fecha = reservation.fecha || reservation.actualizado_en || '';
      if (!fecha) return false;
      
      const [year, month] = fecha.split('-').map(Number);
      return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
    });
    
    console.log(`📊 Reservas del mes actual (segundo refresh): ${currentMonthReservations2.length}`);
    currentMonthReservations2.forEach(r => {
      console.log(`  - ${r.id}: ${r.fecha} (${r.estado})`);
    });

    console.log(`🔧 currentMonthReservations se establecería a: ${currentMonthReservations2.length}`);
    console.log(`🔧 Contador mostraría: ${currentMonthReservations2.length}/${user.monthlyLimit} reservas este mes`);

    // Comparar resultados
    console.log('\n📊 Comparación de resultados:');
    console.log(`  Primer refresh: ${currentMonthReservations.length} reservas`);
    console.log(`  Segundo refresh: ${currentMonthReservations2.length} reservas`);
    console.log(`  Diferencia: ${currentMonthReservations2.length - currentMonthReservations.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  simulateRefresh();
}

module.exports = { simulateRefresh };
