const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testAdminReservations() {
  try {
    console.log('🔍 Verificando reservas para el panel de admin...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Verificar reservas públicas
    console.log('\n1️⃣ Verificando reservas públicas (tabla "reservas")...');
    try {
      const publicResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas!A:N',
      });

      const publicRows = publicResponse.data.values || [];
      console.log(`📊 Total de filas en reservas públicas: ${publicRows.length}`);

      publicRows.forEach((row, index) => {
        console.log(`\n🔍 Fila ${index + 1} (reservas públicas):`);
        console.log(`  Longitud: ${row.length}`);
        console.log(`  Contenido:`, row);
        
        if (row.length >= 15) {
          console.log(`  ✅ Fila válida (>= 15 columnas)`);
          console.log(`  ID: ${row[0]}`);
          console.log(`  Fecha: ${row[1]}`);
          console.log(`  Bloque: ${row[2]}`);
          console.log(`  Horario: ${row[3]}`);
          console.log(`  Cliente: ${row[4]}`);
          console.log(`  Estado: ${row[9]}`);
          console.log(`  Código: ${row[10]}`);
        } else {
          console.log(`  ❌ Fila inválida (< 15 columnas)`);
        }
      });
    } catch (error) {
      console.log('❌ Error obteniendo reservas públicas:', error.message);
    }

    // 2. Verificar reservas de usuarios
    console.log('\n2️⃣ Verificando reservas de usuarios (tabla "reservas_usuarios")...');
    try {
      const userResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A:N',
      });

      const userRows = userResponse.data.values || [];
      console.log(`📊 Total de filas en reservas de usuarios: ${userRows.length}`);

      userRows.forEach((row, index) => {
        console.log(`\n🔍 Fila ${index + 1} (reservas usuarios):`);
        console.log(`  Longitud: ${row.length}`);
        console.log(`  Contenido:`, row);
        
        if (row.length >= 14) {
          console.log(`  ✅ Fila válida (>= 14 columnas)`);
          console.log(`  ID: ${row[0]}`);
          console.log(`  UserID: ${row[1]}`);
          console.log(`  Fecha: ${row[2]}`);
          console.log(`  Bloque: ${row[3]}`);
          console.log(`  Horario: ${row[4]}`);
          console.log(`  Cliente: ${row[5]}`);
          console.log(`  Estado: ${row[10]}`);
          console.log(`  Código: ${row[11]}`);
        } else {
          console.log(`  ❌ Fila inválida (< 14 columnas)`);
        }
      });
    } catch (error) {
      console.log('❌ Error obteniendo reservas de usuarios:', error.message);
    }

    // 3. Simular la lógica de getAllReservations
    console.log('\n3️⃣ Simulando lógica de getAllReservations...');
    
    const allReservations = [];

    // Procesar reservas públicas
    try {
      const publicResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas!A2:N1000', // Sin header
      });

      const publicRows = publicResponse.data.values || [];
      console.log(`📊 Procesando ${publicRows.length} filas de reservas públicas...`);

      publicRows.forEach((row, index) => {
        if (row.length >= 15 && 
            row[0] && // id
            row[1] && // fecha
            row[2] && // bloque
            row[4] && // cliente_nombre
            row[9] && // estado
            row[10]) { // codigo_reserva
          
          const reservation = {
            id: row[0],
            fecha: row[1],
            bloque: row[2],
            horario: row[3] || '',
            cliente_nombre: row[4],
            empresa_marca: row[5] || '',
            direccion_grabacion: row[6] || '',
            correo: row[7] || '',
            notas: row[8] || '',
            estado: row[9],
            codigo_reserva: row[10],
            gcal_event_id_ph1: row[11] || '',
            gcal_event_id_ph2: row[12] || '',
            creado_en: row[13] || '',
            actualizado_en: row[14] || '',
          };
          
          allReservations.push(reservation);
          console.log(`  ✅ Reserva pública agregada: ${reservation.id} - ${reservation.fecha}`);
        } else {
          console.log(`  ❌ Fila ${index + 1} omitida - datos incompletos`);
        }
      });
    } catch (error) {
      console.log('❌ Error procesando reservas públicas:', error.message);
    }

    // Procesar reservas de usuarios
    try {
      const userResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A2:N1000', // Sin header
      });

      const userRows = userResponse.data.values || [];
      console.log(`📊 Procesando ${userRows.length} filas de reservas de usuarios...`);

      userRows.forEach((row, index) => {
        if (row.length >= 14 && 
            row[0] && // id
            row[1] && // userId
            row[2] && // fecha
            row[3] && // bloque
            row[5] && // cliente_nombre
            row[10] && // estado
            row[11]) { // codigo_reserva
          
          const reservation = {
            id: row[0],
            fecha: row[2],
            bloque: row[3],
            horario: row[4] || '',
            cliente_nombre: row[5],
            empresa_marca: row[6] || '',
            direccion_grabacion: row[7] || '',
            correo: row[8] || '',
            notas: row[9] || '',
            estado: row[10],
            codigo_reserva: row[11],
            gcal_event_id_ph1: '',
            gcal_event_id_ph2: '',
            creado_en: row[12] || '',
            actualizado_en: row[13] || '',
          };
          
          allReservations.push(reservation);
          console.log(`  ✅ Reserva de usuario agregada: ${reservation.id} - ${reservation.fecha}`);
        } else {
          console.log(`  ❌ Fila ${index + 1} omitida - datos incompletos`);
        }
      });
    } catch (error) {
      console.log('❌ Error procesando reservas de usuarios:', error.message);
    }

    console.log(`\n📊 Resultado final:`);
    console.log(`  Total de reservas encontradas: ${allReservations.length}`);
    
    allReservations.forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.id} - ${res.fecha} - ${res.bloque} - ${res.cliente_nombre} (${res.estado})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAdminReservations();
}

module.exports = { testAdminReservations };