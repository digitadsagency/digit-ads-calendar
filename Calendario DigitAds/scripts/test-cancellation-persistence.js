const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';
const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';

// Configuración de Google Sheets
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: SHEETS_API_VERSION, auth });
}

// Función para generar ID único
function generateUserId() {
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `USR-${randomString}`;
}

// Simular la función getAllUserReservationsWithCancelled
async function getAllUserReservationsWithCancelled(userId) {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
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
        estado: row[9],
        codigoReserva: row[10],
        fecha: row[2]
      });

      if (row.length >= 13 && row[1] === userId) {
        const id = row[0];
        const estado = row[9];
        const codigoReserva = row[10];
        
        if (id && estado && codigoReserva) {
          const reservation = {
            id: id,
            userId: row[1],
            fecha: row[2] || '',
            bloque: row[3] || 'Mañana',
            cliente_nombre: row[4] || '',
            empresa_marca: row[5] || '',
            direccion_grabacion: row[6] || '',
            whatsapp: row[7] || '',
            notas: row[8] || '',
            estado: estado,
            codigo_reserva: codigoReserva,
            creado_en: row[11] || '',
            actualizado_en: row[12] || '',
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

    return reservations;
  } catch (error) {
    console.error('Error obteniendo todas las reservas del usuario:', error);
    return [];
  }
}

// Crear datos de prueba y simular cancelación
async function testCancellationPersistence() {
  try {
    console.log('🧪 INICIANDO PRUEBA DE PERSISTENCIA DE CANCELACIÓN');
    console.log('==================================================\n');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Limpiar datos anteriores
    console.log('🧹 Limpiando datos anteriores...');
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
    });

    // Crear usuario de prueba
    const testUser = {
      email: 'persistence.test@test.com',
      password: 'test123',
      name: 'Usuario Persistence Test',
      company: 'Test Company',
      monthlyLimit: 2,
      whatsapp: '+52 55 0000 0000',
    };

    const userId = generateUserId();
    const now = new Date().toISOString();
    
    const userRow = [
      userId,
      testUser.email,
      testUser.password,
      testUser.name,
      testUser.company,
      testUser.monthlyLimit,
      testUser.whatsapp,
      now,
      '', // last_login vacío
      true, // is_active
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [userRow],
      },
    });

    console.log('✅ Usuario creado:', testUser.email);

    // Crear reserva de prueba
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reservationDate = tomorrow.toISOString().split('T')[0];
    const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const reservationRow = [
      reservationId,
      userId,
      reservationDate,
      'Mañana',
      testUser.name,
      testUser.company,
      'Dirección de prueba',
      testUser.whatsapp,
      'Reserva de prueba para cancelación',
      'confirmada',
      reservationId,
      now,
      now,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [reservationRow],
      },
    });

    console.log(`✅ Reserva creada: ${reservationId} - ${reservationDate} - Mañana`);

    // PASO 1: Verificar estado inicial
    console.log('\n📋 PASO 1: ESTADO INICIAL');
    console.log('==========================');
    const initialReservations = await getAllUserReservationsWithCancelled(userId);
    console.log(`📊 Reservas iniciales: ${initialReservations.length}`);
    console.log('Estado:', initialReservations[0]?.estado);

    // PASO 2: Simular cancelación
    console.log('\n📋 PASO 2: SIMULANDO CANCELACIÓN');
    console.log('=================================');
    
    // Encontrar la fila de la reserva
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
    });

    const rows = response.data.values || [];
    const reservationRowIndex = rows.findIndex(row => 
      row.length >= 13 && row[0] === reservationId && row[1] === userId
    );

    if (reservationRowIndex === -1) {
      console.log('❌ No se encontró la reserva para cancelar');
      return;
    }

    const actualRowIndex = reservationRowIndex + 2; // +1 por header, +1 por índice base 1
    const cancelTime = new Date().toISOString();
    
    console.log(`🔧 Cancelando reserva en fila ${actualRowIndex}...`);
    
    // Actualizar estado a cancelada
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!J${actualRowIndex}:J${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['cancelada']],
      },
    });

    // Actualizar fecha de actualización
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!M${actualRowIndex}:M${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[cancelTime]],
      },
    });

    console.log('✅ Reserva cancelada en Google Sheets');

    // PASO 3: Verificar estado después de cancelación
    console.log('\n📋 PASO 3: ESTADO DESPUÉS DE CANCELACIÓN');
    console.log('=========================================');
    const afterCancelReservations = await getAllUserReservationsWithCancelled(userId);
    console.log(`📊 Reservas después de cancelar: ${afterCancelReservations.length}`);
    console.log('Estado:', afterCancelReservations[0]?.estado);

    // PASO 4: Verificar datos en Google Sheets directamente
    console.log('\n📋 PASO 4: VERIFICACIÓN DIRECTA EN GOOGLE SHEETS');
    console.log('===============================================');
    const directResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
    });

    const directRows = directResponse.data.values || [];
    console.log(`📊 Filas en Google Sheets: ${directRows.length}`);
    
    directRows.forEach((row, index) => {
      if (index === 0) {
        console.log('📋 Headers:', row);
      } else {
        console.log(`📋 Fila ${index}:`, {
          id: row[0],
          userId: row[1],
          fecha: row[2],
          estado: row[9],
          codigo: row[10],
          actualizado: row[12]
        });
      }
    });

    // RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL');
    console.log('==================');
    if (afterCancelReservations.length > 0 && afterCancelReservations[0].estado === 'cancelada') {
      console.log('✅ ÉXITO: La cancelación se persistió correctamente');
      console.log('✅ El estado se mantiene como "cancelada"');
    } else {
      console.log('❌ PROBLEMA: La cancelación no se persistió');
      console.log('❌ El estado no se mantiene como "cancelada"');
    }

    console.log('\n🔍 INSTRUCCIONES DE PRUEBA MANUAL:');
    console.log('1. Ve al dashboard del usuario: http://localhost:3001/client');
    console.log('2. Haz login con:', testUser.email, '/', testUser.password);
    console.log('3. Verifica que la reserva aparezca como "cancelada"');
    console.log('4. Ve al panel de admin: http://localhost:3001/admin');
    console.log('5. Verifica que la reserva aparezca como "cancelada"');
    console.log('6. Regresa al dashboard del usuario');
    console.log('7. Verifica que la reserva SIGA apareciendo como "cancelada"');

  } catch (error) {
    console.error('❌ Error en prueba de persistencia:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCancellationPersistence();
}

module.exports = { testCancellationPersistence };
