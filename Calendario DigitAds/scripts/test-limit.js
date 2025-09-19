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

// Crear usuario de prueba con límite de 1 reserva
async function createTestUserWithLimit() {
  try {
    console.log('🧪 Creando usuario de prueba con límite de 1 reserva...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Crear usuario con límite de 1 reserva
    const testUser = {
      email: 'limite@test.com',
      password: 'limite123',
      name: 'Usuario Límite',
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

    // Crear una reserva para este mes (para que alcance el límite)
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const testDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`;

    const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const reservationRow = [
      reservationId,
      id, // userId
      testDate,
      'Mañana',
      testUser.name,
      testUser.company,
      'Dirección de prueba',
      testUser.whatsapp,
      'Reserva de prueba para límite',
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

    console.log('✅ Reserva creada para el usuario');
    console.log('');
    console.log('🎯 Usuario de prueba listo:');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log(`📅 Límite: ${testUser.monthlyLimit} reserva/mes`);
    console.log(`📋 Ya tiene 1 reserva este mes (${currentMonth}/${currentYear})`);
    console.log('');
    console.log('🔍 Para probar:');
    console.log('1. Ve a /client/login');
    console.log('2. Usa las credenciales de arriba');
    console.log('3. Intenta hacer una segunda reserva');
    console.log('4. Deberías ver el mensaje de límite alcanzado');

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUserWithLimit();
}

module.exports = { createTestUserWithLimit };
