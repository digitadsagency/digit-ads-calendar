const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function debugReservationSystem() {
  try {
    console.log('🔍 Debugging completo del sistema de reservas...');
    
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

    const reservations = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`📅 Fecha actual: ${now.toISOString()}`);
    console.log(`📅 Año actual: ${currentYear}`);
    console.log(`📅 Mes actual: ${currentMonth}`);

    rows.forEach((row, index) => {
      if (index > 0 && row.length >= 14) { // Saltar header
        const id = row[0];
        const userId = row[1];
        const fecha = row[2];
        const estado = row[10];
        const codigoReserva = row[11];
        
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
        }
      }
    });

    // 2. Analizar contador mensual por usuario
    console.log('\n2️⃣ Analizando contador mensual por usuario...');
    
    const userCounts = {};
    reservations.forEach(res => {
      const [year, month] = res.fecha.split('-').map(Number);
      const isCurrentMonth = year === currentYear && month === currentMonth;
      const isConfirmed = res.estado === 'confirmada';
      
      if (isCurrentMonth && isConfirmed) {
        if (!userCounts[res.userId]) {
          userCounts[res.userId] = 0;
        }
        userCounts[res.userId]++;
      }
    });

    console.log('📊 Contadores mensuales por usuario:');
    Object.keys(userCounts).forEach(userId => {
      console.log(`  ${userId}: ${userCounts[userId]} reservas confirmadas este mes`);
    });

    // 3. Verificar duplicados
    console.log('\n3️⃣ Verificando duplicados...');
    
    const codigos = {};
    reservations.forEach(res => {
      if (!codigos[res.codigoReserva]) {
        codigos[res.codigoReserva] = [];
      }
      codigos[res.codigoReserva].push(res);
    });

    Object.keys(codigos).forEach(codigo => {
      const reservas = codigos[codigo];
      if (reservas.length > 1) {
        console.log(`⚠️  Código duplicado: ${codigo} (${reservas.length} reservas)`);
        reservas.forEach(res => {
          console.log(`    - ${res.id} - ${res.userId} - ${res.estado}`);
        });
      }
    });

    // 4. Verificar inconsistencias de estado
    console.log('\n4️⃣ Verificando inconsistencias de estado...');
    
    const estadosPorCodigo = {};
    reservations.forEach(res => {
      if (!estadosPorCodigo[res.codigoReserva]) {
        estadosPorCodigo[res.codigoReserva] = [];
      }
      estadosPorCodigo[res.codigoReserva].push(res.estado);
    });

    Object.keys(estadosPorCodigo).forEach(codigo => {
      const estados = estadosPorCodigo[codigo];
      const estadosUnicos = [...new Set(estados)];
      
      if (estadosUnicos.length > 1) {
        console.log(`⚠️  Código ${codigo}: Estados inconsistentes - ${estados.join(', ')}`);
      }
    });

    // 5. Verificar fechas duplicadas
    console.log('\n5️⃣ Verificando fechas duplicadas...');
    
    const fechasPorUsuario = {};
    reservations.forEach(res => {
      if (!fechasPorUsuario[res.userId]) {
        fechasPorUsuario[res.userId] = {};
      }
      if (!fechasPorUsuario[res.userId][res.fecha]) {
        fechasPorUsuario[res.userId][res.fecha] = [];
      }
      fechasPorUsuario[res.userId][res.fecha].push(res);
    });

    Object.keys(fechasPorUsuario).forEach(userId => {
      Object.keys(fechasPorUsuario[userId]).forEach(fecha => {
        const reservasEnFecha = fechasPorUsuario[userId][fecha];
        if (reservasEnFecha.length > 1) {
          console.log(`⚠️  Usuario ${userId} tiene ${reservasEnFecha.length} reservas en ${fecha}:`);
          reservasEnFecha.forEach(res => {
            console.log(`    - ${res.id} - ${res.estado}`);
          });
        }
      });
    });

    // 6. Resumen final
    console.log('\n6️⃣ Resumen final:');
    console.log(`📊 Total de reservas: ${reservations.length}`);
    console.log(`📊 Reservas confirmadas este mes: ${Object.values(userCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`📊 Usuarios con reservas: ${Object.keys(userCounts).length}`);
    
    const problemas = [];
    if (Object.keys(codigos).some(codigo => codigos[codigo].length > 1)) {
      problemas.push('Códigos duplicados');
    }
    if (Object.keys(estadosPorCodigo).some(codigo => [...new Set(estadosPorCodigo[codigo])].length > 1)) {
      problemas.push('Estados inconsistentes');
    }
    if (Object.keys(fechasPorUsuario).some(userId => 
      Object.keys(fechasPorUsuario[userId]).some(fecha => fechasPorUsuario[userId][fecha].length > 1)
    )) {
      problemas.push('Fechas duplicadas por usuario');
    }
    
    if (problemas.length > 0) {
      console.log(`⚠️  Problemas encontrados: ${problemas.join(', ')}`);
    } else {
      console.log(`✅ No se encontraron problemas`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugReservationSystem();
}

module.exports = { debugReservationSystem };
