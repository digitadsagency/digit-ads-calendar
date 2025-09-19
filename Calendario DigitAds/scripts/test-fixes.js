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

// Crear usuario de prueba para verificar las correcciones
async function createTestUserForFixes() {
  try {
    console.log('🧪 Creando usuario de prueba para verificar correcciones...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Crear usuario
    const testUser = {
      email: 'testfixes@ejemplo.com',
      password: 'test123',
      name: 'Usuario Test Fixes',
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

    // Crear reservas para probar diferentes escenarios
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const reservations = [
      {
        date: tomorrow.toISOString().split('T')[0], // Mañana (no se puede cancelar)
        block: 'Mañana',
        description: 'Reserva de mañana (NO se puede cancelar - menos de 24h)'
      },
      {
        date: nextWeek.toISOString().split('T')[0], // Próxima semana (se puede cancelar)
        block: 'Tarde',
        description: 'Reserva de próxima semana (SÍ se puede cancelar)'
      }
    ];

    for (const reservation of reservations) {
      const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const reservationRow = [
        reservationId,
        id, // userId
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

      console.log(`✅ Reserva creada: ${reservation.date} - ${reservation.block}`);
    }

    console.log('');
    console.log('🎯 Usuario de prueba listo:');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log(`📅 Límite: ${testUser.monthlyLimit} reservas/mes`);
    console.log('');
    console.log('📋 Reservas creadas:');
    console.log(`1. ${reservations[0].date} - ${reservations[0].block} (${reservations[0].description})`);
    console.log(`2. ${reservations[1].date} - ${reservations[1].block} (${reservations[1].description})`);
    console.log('');
    console.log('🔍 Para probar las correcciones:');
    console.log('1. Ve a http://localhost:3000/client/login');
    console.log('2. Usa las credenciales de arriba');
    console.log('3. Verifica que las fechas se muestren correctamente (no un día antes)');
    console.log('4. Ve a "Mis Reservas"');
    console.log('5. Intenta cancelar cada reserva:');
    console.log('   - La de mañana: NO debería permitir cancelar');
    console.log('   - La de próxima semana: SÍ debería permitir cancelar');
    console.log('6. Verifica que el contador de reservas se actualice correctamente');
    console.log('7. Intenta hacer una nueva reserva en el mismo horario:');
    console.log('   - Debería mostrar que el bloque ya está ocupado');

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUserForFixes();
}

module.exports = { createTestUserForFixes };
