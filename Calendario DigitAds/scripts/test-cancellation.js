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

// Crear usuario de prueba con reservas para probar cancelación
async function createTestUserForCancellation() {
  try {
    console.log('🧪 Creando usuario de prueba para cancelación...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Crear usuario
    const testUser = {
      email: 'cancelar@test.com',
      password: 'cancelar123',
      name: 'Usuario Cancelar',
      company: 'Test Company',
      monthlyLimit: 3,
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

    // Crear reservas para diferentes fechas
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
      },
      {
        date: nextMonth.toISOString().split('T')[0], // Próximo mes (se puede cancelar)
        block: 'Mañana',
        description: 'Reserva del próximo mes (SÍ se puede cancelar)'
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
    console.log(`3. ${reservations[2].date} - ${reservations[2].block} (${reservations[2].description})`);
    console.log('');
    console.log('🔍 Para probar:');
    console.log('1. Ve a /client/login');
    console.log('2. Usa las credenciales de arriba');
    console.log('3. Ve a "Mis Reservas"');
    console.log('4. Intenta cancelar cada reserva:');
    console.log('   - La de mañana: NO debería permitir cancelar');
    console.log('   - Las de próxima semana y mes: SÍ deberían permitir cancelar');

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUserForCancellation();
}

module.exports = { createTestUserForCancellation };
