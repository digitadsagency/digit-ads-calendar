const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testCancellationStatus() {
  try {
    console.log('🔍 Verificando estado de cancelaciones en Google Sheets...');
    
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
      console.log(`  Contenido completo:`, row);
      
      if (row.length >= 13) {
        const id = row[0];
        const userId = row[1];
        const fecha = row[2];
        const bloque = row[3];
        const horario = row.length >= 14 ? row[4] : '';
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        const actualizadoEn = row.length >= 14 ? row[13] : row[12];
        
        console.log(`  ID: ${id}`);
        console.log(`  UserID: ${userId}`);
        console.log(`  Fecha: ${fecha}`);
        console.log(`  Bloque: ${bloque}`);
        console.log(`  Horario: ${horario}`);
        console.log(`  Estado: ${estado}`);
        console.log(`  Código: ${codigoReserva}`);
        console.log(`  Actualizado: ${actualizadoEn}`);
        
        // Verificar si es una reserva cancelada
        if (estado === 'cancelada') {
          console.log(`  🚫 ESTA RESERVA ESTÁ CANCELADA`);
        } else if (estado === 'confirmada') {
          console.log(`  ✅ ESTA RESERVA ESTÁ CONFIRMADA`);
        } else {
          console.log(`  ❓ ESTADO DESCONOCIDO: ${estado}`);
        }
      }
    });

    // Verificar problemas específicos
    console.log('\n🔍 Verificando problemas específicos...');
    
    // Buscar reservas duplicadas o con problemas
    const reservations = [];
    rows.forEach((row, index) => {
      if (index > 0 && row.length >= 13) { // Saltar header
        const id = row[0];
        const userId = row[1];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        if (id && userId && estado && codigoReserva) {
          reservations.push({
            id,
            userId,
            estado,
            codigoReserva,
            rowIndex: index + 1
          });
        }
      }
    });

    // Buscar códigos duplicados
    const codigos = {};
    reservations.forEach(res => {
      if (!codigos[res.codigoReserva]) {
        codigos[res.codigoReserva] = [];
      }
      codigos[res.codigoReserva].push(res);
    });

    console.log('\n📊 Análisis de códigos de reserva:');
    Object.keys(codigos).forEach(codigo => {
      const reservas = codigos[codigo];
      console.log(`\n  Código ${codigo}:`);
      reservas.forEach(res => {
        console.log(`    - ID: ${res.id}, Estado: ${res.estado}, Usuario: ${res.userId}, Fila: ${res.rowIndex}`);
      });
      
      if (reservas.length > 1) {
        console.log(`    ⚠️  PROBLEMA: Código duplicado encontrado!`);
      }
    });

    // Verificar inconsistencias de estado
    console.log('\n📊 Verificando inconsistencias de estado:');
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
        console.log(`  ⚠️  Código ${codigo}: Estados inconsistentes - ${estados.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCancellationStatus();
}

module.exports = { testCancellationStatus };
