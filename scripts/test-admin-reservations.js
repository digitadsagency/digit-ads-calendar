const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';
const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';
const PUBLIC_RESERVATIONS_SHEET_NAME = 'reservas';

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

// Crear datos de prueba para el panel de admin
async function createAdminTestData() {
  try {
    console.log('🧪 Creando datos de prueba para el panel de admin...');

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

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${PUBLIC_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    // Escribir headers
    const userHeaders = [
      'id', 'userId', 'fecha', 'bloque', 'cliente_nombre', 'empresa_marca',
      'direccion_grabacion', 'whatsapp', 'notas', 'estado', 'codigo_reserva',
      'creado_en', 'actualizado_en'
    ];

    const publicHeaders = [
      'id', 'fecha', 'bloque', 'cliente_nombre', 'empresa_marca',
      'direccion_grabacion', 'whatsapp', 'notas', 'estado', 'codigo_reserva',
      'gcal_event_id_ph1', 'gcal_event_id_ph2', 'creado_en', 'actualizado_en'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A1:M1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [userHeaders],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${PUBLIC_RESERVATIONS_SHEET_NAME}!A1:N1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [publicHeaders],
      },
    });

    // Crear usuario de prueba
    const testUser = {
      email: 'admin.test@test.com',
      password: 'test123',
      name: 'Usuario Admin Test',
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

    // Crear reservas de usuario
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const userReservations = [
      {
        date: nextWeek.toISOString().split('T')[0],
        block: 'Mañana',
        description: 'Reserva de usuario 1'
      },
      {
        date: nextMonth.toISOString().split('T')[0],
        block: 'Tarde',
        description: 'Reserva de usuario 2'
      }
    ];

    for (const reservation of userReservations) {
      const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const reservationRow = [
        reservationId,
        userId,
        reservation.date,
        reservation.block,
        testUser.name,
        testUser.company,
        'Dirección de prueba',
        testUser.whatsapp,
        reservation.description,
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

      console.log(`✅ Reserva de usuario creada: ${reservation.date} - ${reservation.block}`);
    }

    // Crear reservas públicas
    const publicReservations = [
      {
        date: nextWeek.toISOString().split('T')[0],
        block: 'Tarde',
        description: 'Reserva pública 1'
      },
      {
        date: nextMonth.toISOString().split('T')[0],
        block: 'Mañana',
        description: 'Reserva pública 2'
      }
    ];

    for (const reservation of publicReservations) {
      const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const reservationRow = [
        reservationId,
        reservation.date,
        reservation.block,
        'Cliente Público',
        'Empresa Pública',
        'Dirección pública',
        '+52 55 0000 0000',
        reservation.description,
        'confirmada',
        reservationId,
        '', // gcal_event_id_ph1
        '', // gcal_event_id_ph2
        now,
        now,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${PUBLIC_RESERVATIONS_SHEET_NAME}!A:N`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [reservationRow],
        },
      });

      console.log(`✅ Reserva pública creada: ${reservation.date} - ${reservation.block}`);
    }

    console.log('');
    console.log('🎯 Datos de prueba para admin listos:');
    console.log(`📧 Usuario: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log(`📅 Límite: ${testUser.monthlyLimit} reservas/mes`);
    console.log(`🆔 ID de Usuario: ${userId}`);
    console.log('');
    console.log('📊 Reservas creadas:');
    console.log('   - 2 reservas de usuario (confirmadas)');
    console.log('   - 2 reservas públicas (confirmadas)');
    console.log('   - Total: 4 reservas para mostrar en admin');
    console.log('');
    console.log('🔍 INSTRUCCIONES DE PRUEBA:');
    console.log('');
    console.log('1️⃣ VERIFICAR PANEL DE ADMIN:');
    console.log('   - Ve a http://localhost:3001/admin');
    console.log('   - Haz login con las credenciales de admin');
    console.log('   - ✅ DEBERÍA: Mostrar 4 reservas en total');
    console.log('   - ✅ DEBERÍA: Mostrar estadísticas correctas');
    console.log('   - ✅ DEBERÍA: Mostrar tabla con todas las reservas');
    console.log('');
    console.log('2️⃣ VERIFICAR ESTADÍSTICAS:');
    console.log('   - Total Reservas: 4');
    console.log('   - Confirmadas: 4');
    console.log('   - Canceladas: 0');
    console.log('');
    console.log('3️⃣ VERIFICAR TABLA:');
    console.log('   - ✅ DEBERÍA: Mostrar reservas de usuarios');
    console.log('   - ✅ DEBERÍA: Mostrar reservas públicas');
    console.log('   - ✅ DEBERÍA: Mostrar fechas, bloques, clientes');
    console.log('   - ✅ DEBERÍA: Mostrar botones de cancelar');
    console.log('');
    console.log('4️⃣ VERIFICAR LOGS:');
    console.log('   - Abre las herramientas de desarrollador (F12)');
    console.log('   - Ve a la pestaña "Console"');
    console.log('   - ✅ DEBERÍA ver:');
    console.log('     * "📊 Total de reservas obtenidas: 4 (públicas + usuarios)"');
    console.log('     * "📊 API Reservas - Todas las reservas: 4 reservas"');
    console.log('     * Detalles de las 4 reservas');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminTestData();
}

module.exports = { createAdminTestData };
