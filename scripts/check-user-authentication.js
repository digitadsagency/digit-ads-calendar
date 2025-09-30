const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function checkUserAuthentication() {
  try {
    console.log('🔍 Verificando autenticación de usuarios...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Verificar usuarios en Google Sheets
    console.log('\n1️⃣ Usuarios en Google Sheets...');
    
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'usuarios!A:F',
    });

    const userRows = usersResponse.data.values || [];
    console.log(`📊 Total de usuarios en Google Sheets: ${userRows.length}`);

    const users = [];
    userRows.forEach((row, index) => {
      if (index > 0 && row.length >= 6) { // Saltar header
        const user = {
          id: row[0],
          email: row[1],
          name: row[2],
          company: row[3],
          monthlyLimit: parseInt(row[4]) || 3,
          isActive: row[5] === 'true'
        };
        
        if (user.id && user.email) {
          users.push(user);
          console.log(`👤 Usuario: ${user.id} - ${user.email} - ${user.name} - Límite: ${user.monthlyLimit}`);
        }
      }
    });

    // 2. Verificar reservas por usuario
    console.log('\n2️⃣ Reservas por usuario...');
    
    const reservationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
    });

    const reservationRows = reservationsResponse.data.values || [];
    console.log(`📊 Total de reservas: ${reservationRows.length}`);

    const userReservationCounts = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    reservationRows.forEach((row, index) => {
      if (index > 0 && row.length >= 13) { // Saltar header
        const userId = row[1];
        const fecha = row[2];
        const estado = row.length >= 14 ? row[10] : row[9];
        
        if (userId && fecha && estado) {
          if (!userReservationCounts[userId]) {
            userReservationCounts[userId] = {
              total: 0,
              currentMonth: 0,
              confirmed: 0,
              cancelled: 0
            };
          }
          
          userReservationCounts[userId].total++;
          
          if (estado === 'confirmada') {
            userReservationCounts[userId].confirmed++;
          } else if (estado === 'cancelada') {
            userReservationCounts[userId].cancelled++;
          }
          
          // Verificar si es del mes actual
          const [year, month] = fecha.split('-').map(Number);
          if (year === currentYear && month === currentMonth && estado === 'confirmada') {
            userReservationCounts[userId].currentMonth++;
          }
        }
      }
    });

    console.log('\n📊 Resumen de reservas por usuario:');
    Object.keys(userReservationCounts).forEach(userId => {
      const counts = userReservationCounts[userId];
      console.log(`👤 ${userId}:`);
      console.log(`  Total: ${counts.total}`);
      console.log(`  Confirmadas: ${counts.confirmed}`);
      console.log(`  Canceladas: ${counts.cancelled}`);
      console.log(`  Este mes: ${counts.currentMonth}`);
    });

    // 3. Verificar usuarios activos vs usuarios con reservas
    console.log('\n3️⃣ Verificando usuarios activos vs usuarios con reservas...');
    
    const usersWithReservations = Object.keys(userReservationCounts);
    const activeUsers = users.filter(u => u.isActive);
    
    console.log(`👥 Usuarios activos: ${activeUsers.length}`);
    console.log(`📋 Usuarios con reservas: ${usersWithReservations.length}`);
    
    activeUsers.forEach(user => {
      const hasReservations = usersWithReservations.includes(user.id);
      const currentMonthCount = userReservationCounts[user.id]?.currentMonth || 0;
      console.log(`👤 ${user.id} (${user.email}):`);
      console.log(`  Tiene reservas: ${hasReservations ? 'SÍ' : 'NO'}`);
      console.log(`  Reservas este mes: ${currentMonthCount}/${user.monthlyLimit}`);
    });

    // 4. Identificar posibles problemas
    console.log('\n4️⃣ Identificando posibles problemas...');
    
    const problems = [];
    
    // Usuarios con reservas pero no activos
    usersWithReservations.forEach(userId => {
      const user = users.find(u => u.id === userId);
      if (!user || !user.isActive) {
        problems.push(`Usuario ${userId} tiene reservas pero no está activo`);
      }
    });
    
    // Usuarios activos sin reservas
    activeUsers.forEach(user => {
      if (!usersWithReservations.includes(user.id)) {
        problems.push(`Usuario activo ${user.id} no tiene reservas`);
      }
    });
    
    if (problems.length > 0) {
      console.log('⚠️ Problemas encontrados:');
      problems.forEach(problem => console.log(`  - ${problem}`));
    } else {
      console.log('✅ No se encontraron problemas obvios');
    }

    // 5. Recomendaciones
    console.log('\n5️⃣ Recomendaciones para debugging:');
    console.log('1. Verificar que el usuario que hace login tenga el mismo ID que en Google Sheets');
    console.log('2. Verificar que el usuario esté activo (is_active = true)');
    console.log('3. Verificar que las reservas estén en estado "confirmada"');
    console.log('4. Verificar que las fechas de las reservas sean del mes actual');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkUserAuthentication();
}

module.exports = { checkUserAuthentication };
