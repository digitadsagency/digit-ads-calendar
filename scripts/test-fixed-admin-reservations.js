const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Simular la función getAllReservations arreglada
async function getAllReservationsFixed() {
  try {
    console.log('🔍 Probando función getAllReservations arreglada...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const allReservations = [];

    // Obtener reservas públicas
    try {
      const publicResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas!A2:O1000', // Cambiar a O para incluir actualizado_en
      });

      const publicRows = publicResponse.data.values || [];
      console.log(`📊 Procesando ${publicRows.length} filas de reservas públicas...`);
      
      publicRows.forEach((row, index) => {
        // Solo procesar filas que tengan todos los datos esenciales
        // Para reservas públicas, necesitamos al menos 14 columnas (sin userId)
        if (row.length >= 14 && 
            row[0] && // id
            row[1] && // fecha
            row[2] && // bloque
            row[4] && // cliente_nombre (ahora en posición 4)
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
          console.log(`  ❌ Fila ${index + 1} omitida - datos incompletos (longitud: ${row.length})`);
        }
      });
    } catch (error) {
      console.log('No se pudieron obtener reservas públicas:', error.message);
    }

    // Obtener reservas de usuarios
    try {
      const userResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A2:N1000', // Cambiar a N para incluir todas las columnas
      });

      const userRows = userResponse.data.values || [];
      console.log(`📊 Procesando ${userRows.length} filas de reservas de usuarios...`);
      
      userRows.forEach((row, index) => {
        // Solo procesar filas que tengan todos los datos esenciales
        if (row.length >= 14 && 
            row[0] && // id
            row[1] && // userId
            row[2] && // fecha
            row[3] && // bloque
            row[5] && // cliente_nombre (ahora en posición 5)
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
          console.log(`  ❌ Fila ${index + 1} omitida - datos incompletos (longitud: ${row.length})`);
        }
      });
    } catch (error) {
      console.log('No se pudieron obtener reservas de usuarios:', error.message);
    }

    console.log(`\n📊 Total de reservas obtenidas: ${allReservations.length} (públicas + usuarios)`);
    console.log('📊 Reservas válidas:', allReservations.map(r => ({ 
      id: r.id, 
      fecha: r.fecha, 
      estado: r.estado,
      cliente: r.cliente_nombre 
    })));
    
    // Ordenar por fecha (más recientes primero)
    const sortedReservations = allReservations.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    console.log('\n📋 Reservas ordenadas por fecha:');
    sortedReservations.forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.id} - ${res.fecha} - ${res.bloque} - ${res.cliente_nombre} (${res.estado})`);
    });

    return sortedReservations;
  } catch (error) {
    console.error('Error obteniendo todas las reservas:', error);
    return [];
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  getAllReservationsFixed();
}

module.exports = { getAllReservationsFixed };
