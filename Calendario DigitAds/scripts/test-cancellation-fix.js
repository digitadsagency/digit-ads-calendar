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

// Crear datos de prueba simples
async function createTestData() {
  try {
    console.log('🧪 Creando datos de prueba para verificar la corrección...');

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

    // Escribir headers
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

    // Crear usuario de prueba
    const testUser = {
      email: 'fix.test@test.com',
      password: 'test123',
      name: 'Usuario Fix Test',
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
      'Reserva de prueba para verificar corrección',
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

    console.log('\n🎯 DATOS DE PRUEBA LISTOS');
    console.log('==========================');
    console.log(`📧 Usuario: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log(`🆔 ID de Usuario: ${userId}`);
    console.log(`🆔 ID de Reserva: ${reservationId}`);
    console.log(`📅 Fecha: ${reservationDate}`);
    console.log(`⏰ Bloque: Mañana`);
    console.log(`📊 Estado: confirmada`);
    console.log('');
    console.log('🔍 INSTRUCCIONES DE PRUEBA:');
    console.log('');
    console.log('1️⃣ VERIFICAR ESTADO INICIAL:');
    console.log('   - Ve a http://localhost:3001/client');
    console.log('   - Haz login con:', testUser.email, '/', testUser.password);
    console.log('   - ✅ DEBERÍA: Ver 1 reserva con estado "confirmada"');
    console.log('   - ✅ DEBERÍA: Ver "1/2 reservas este mes"');
    console.log('');
    console.log('2️⃣ CANCELAR RESERVA:');
    console.log('   - Haz click en "Cancelar" en la reserva');
    console.log('   - ✅ DEBERÍA: Ver mensaje de éxito');
    console.log('   - ✅ DEBERÍA: La reserva cambiar a estado "cancelada"');
    console.log('   - ✅ DEBERÍA: Ver "0/2 reservas este mes"');
    console.log('');
    console.log('3️⃣ VERIFICAR PERSISTENCIA:');
    console.log('   - Ve al panel de admin: http://localhost:3001/admin');
    console.log('   - ✅ DEBERÍA: Ver la reserva con estado "cancelada"');
    console.log('   - Regresa al dashboard del usuario');
    console.log('   - ✅ DEBERÍA: La reserva SIGA apareciendo como "cancelada"');
    console.log('   - ✅ DEBERÍA: Seguir viendo "0/2 reservas este mes"');
    console.log('');
    console.log('4️⃣ VERIFICAR EN GOOGLE SHEETS:');
    console.log('   - Abre Google Sheets');
    console.log('   - Ve a la hoja "reservas_usuarios"');
    console.log('   - ✅ DEBERÍA: Ver solo 1 fila (la reserva cancelada)');
    console.log('   - ✅ DEBERÍA: La columna J (estado) debe decir "cancelada"');
    console.log('   - ✅ NO DEBERÍA: Ver filas vacías o duplicadas');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };