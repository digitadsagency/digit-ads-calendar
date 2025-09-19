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

// Crear usuario de prueba para verificar actualización de UI
async function createTestUserForUIUpdate() {
  try {
    console.log('🧪 Creando usuario de prueba para verificar actualización de UI...');

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
      email: 'ui.update@test.com',
      password: 'test123',
      name: 'Usuario UI Update',
      company: 'Test Company',
      monthlyLimit: 2,
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
      'Reserva de prueba para UI update',
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
    console.log('🎯 Usuario de prueba listo:');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log(`📅 Límite: ${testUser.monthlyLimit} reservas/mes`);
    console.log(`🆔 ID de Usuario: ${id}`);
    console.log(`🆔 ID de Reserva: ${reservationId}`);
    console.log(`📅 Fecha de Reserva: ${reservationDate}`);
    console.log('');
    console.log('🔍 PRUEBAS A REALIZAR:');
    console.log('');
    console.log('1️⃣ VERIFICAR RESERVA INICIAL:');
    console.log('   - Ve a http://localhost:3001/client/login');
    console.log('   - Usa las credenciales de arriba');
    console.log('   - Ve a "Mis Reservas"');
    console.log('   - ✅ DEBERÍA: Mostrar 1 reserva confirmada');
    console.log('   - ✅ DEBERÍA: Mostrar "1/2 reservas este mes"');
    console.log('   - ✅ DEBERÍA: Mostrar botón "Cancelar"');
    console.log('');
    console.log('2️⃣ CANCELAR RESERVA Y VERIFICAR UI:');
    console.log('   - Haz click en "Cancelar"');
    console.log('   - Confirma la cancelación');
    console.log('   - ✅ DEBERÍA:');
    console.log('     * Mostrar "Reserva cancelada exitosamente"');
    console.log('     * ACTUALIZAR INMEDIATAMENTE la interfaz');
    console.log('     * Cambiar el estado a "Cancelada" (rojo)');
    console.log('     * Mostrar "0/2 reservas este mes"');
    console.log('     * Permitir hacer una nueva reserva');
    console.log('     * El botón debe cambiar a "Cancelada" o desaparecer');
    console.log('');
    console.log('3️⃣ VERIFICAR LOGS EN CONSOLA:');
    console.log('   - Abre las herramientas de desarrollador (F12)');
    console.log('   - Ve a la pestaña "Console"');
    console.log('   - ✅ DEBERÍA ver logs como:');
    console.log('     * "🔄 Actualizando estado local inmediatamente..."');
    console.log('     * "📊 Estado local actualizado: [...]"');
    console.log('     * "🔄 Recargando reservas después de cancelar..."');
    console.log('     * "✅ Reservas recargadas"');
    console.log('');
    console.log('4️⃣ VERIFICAR GOOGLE SHEETS:');
    console.log('   - Ve a Google Sheets');
    console.log('   - ✅ DEBERÍA: Los datos de la reserva NO deben borrarse');
    console.log('   - ✅ DEBERÍA: Solo el estado debe cambiar a "cancelada"');
    console.log('   - ✅ DEBERÍA: La fecha de actualización debe cambiar');
    console.log('   - ✅ DEBERÍA: NO debe haber filas duplicadas');

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUserForUIUpdate();
}

module.exports = { createTestUserForUIUpdate };
