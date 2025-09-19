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

// Crear usuario de prueba simple para cancelación
async function createSimpleTestUser() {
  try {
    console.log('🧪 Creando usuario de prueba simple para cancelación...');

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

    // Escribir header
    const headers = [
      'id', 'userId', 'fecha', 'bloque', 'cliente_nombre', 'empresa_marca',
      'direccion_grabacion', 'whatsapp', 'notas', 'estado', 'codigo_reserva',
      'creado_en', 'actualizado_en'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A1:M1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    // Crear usuario
    const testUser = {
      email: 'simple.test@test.com',
      password: 'test123',
      name: 'Usuario Simple Test',
      company: 'Test Company',
      monthlyLimit: 1,
      whatsapp: '+52 55 0000 0000',
    };

    const id = generateUserId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
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
        values: [newRow],
      },
    });

    console.log('✅ Usuario creado:', testUser.email);

    // Crear una reserva para probar cancelación
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const reservationDate = nextWeek.toISOString().split('T')[0];
    
    const reservationRow = [
      reservationId,
      id, // userId
      reservationDate,
      'Mañana',
      testUser.name,
      testUser.company,
      'Dirección de prueba',
      testUser.whatsapp,
      'Reserva de prueba simple',
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

    console.log(`✅ Reserva creada: ${reservationDate} - Mañana`);

    console.log('');
    console.log('🎯 Usuario de prueba simple listo:');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log(`📅 Límite: ${testUser.monthlyLimit} reserva/mes`);
    console.log(`🆔 ID de Usuario: ${id}`);
    console.log(`🆔 ID de Reserva: ${reservationId}`);
    console.log(`📅 Fecha de Reserva: ${reservationDate}`);
    console.log('');
    console.log('🔍 INSTRUCCIONES DE PRUEBA:');
    console.log('');
    console.log('1️⃣ LOGIN:');
    console.log('   - Ve a http://localhost:3001/client/login');
    console.log('   - Usa: simple.test@test.com / test123');
    console.log('');
    console.log('2️⃣ VERIFICAR ESTADO INICIAL:');
    console.log('   - Debe mostrar "1/1 reservas este mes"');
    console.log('   - Debe mostrar 1 reserva confirmada (verde)');
    console.log('   - Debe mostrar botón "Cancelar"');
    console.log('');
    console.log('3️⃣ CANCELAR RESERVA:');
    console.log('   - Haz click en "Cancelar"');
    console.log('   - Confirma la cancelación');
    console.log('   - Abre las herramientas de desarrollador (F12)');
    console.log('   - Ve a la pestaña "Console"');
    console.log('');
    console.log('4️⃣ VERIFICAR LOGS:');
    console.log('   - ✅ DEBERÍA ver:');
    console.log('     * "🔄 Actualizando estado local inmediatamente..."');
    console.log('     * "📊 Estado local actualizado: [...]"');
    console.log('     * "🔄 Recargando reservas después de cancelar..."');
    console.log('     * "✅ Reservas recargadas"');
    console.log('     * "🔄 Forzando actualización del contador mensual..."');
    console.log('     * "📊 Contador mensual actualizado: {...}"');
    console.log('     * "🔄 Actualización adicional después de 1 segundo..."');
    console.log('     * "✅ Actualización adicional completada"');
    console.log('');
    console.log('5️⃣ VERIFICAR UI:');
    console.log('   - ✅ DEBERÍA:');
    console.log('     * Mostrar "0/1 reservas este mes"');
    console.log('     * Cambiar el estado a "Cancelada" (rojo)');
    console.log('     * Permitir hacer una nueva reserva');
    console.log('     * El botón debe cambiar o desaparecer');

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSimpleTestUser();
}

module.exports = { createSimpleTestUser };
