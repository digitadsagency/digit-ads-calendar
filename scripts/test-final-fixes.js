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

// Crear usuarios de prueba para verificar las correcciones finales
async function createTestUsersForFinalFixes() {
  try {
    console.log('🧪 Creando usuarios de prueba para verificar correcciones finales...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Crear dos usuarios para probar
    const testUsers = [
      {
        email: 'test1@final.com',
        password: 'test123',
        name: 'Usuario Test Final 1',
        company: 'Test Company Final 1',
        monthlyLimit: 2,
        whatsapp: '+52 55 0000 0001',
      },
      {
        email: 'test2@final.com',
        password: 'test123',
        name: 'Usuario Test Final 2',
        company: 'Test Company Final 2',
        monthlyLimit: 2,
        whatsapp: '+52 55 0000 0002',
      }
    ];

    const userIds = [];

    for (const testUser of testUsers) {
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

      userIds.push(id);
      console.log(`✅ Usuario creado: ${testUser.email} (ID: ${id})`);
    }

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
        userId: userIds[0],
        date: tomorrow.toISOString().split('T')[0], // Mañana (no se puede cancelar)
        block: 'Mañana',
        description: 'Reserva de mañana (NO se puede cancelar - menos de 24h)'
      },
      {
        userId: userIds[0],
        date: nextWeek.toISOString().split('T')[0], // Próxima semana (se puede cancelar)
        block: 'Tarde',
        description: 'Reserva de próxima semana (SÍ se puede cancelar)'
      },
      {
        userId: userIds[1],
        date: nextWeek.toISOString().split('T')[0], // Mismo día, mismo bloque que usuario 1
        block: 'Tarde',
        description: 'Reserva duplicada para probar verificación'
      }
    ];

    for (const reservation of reservations) {
      const reservationId = `DIG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const reservationRow = [
        reservationId,
        reservation.userId,
        reservation.date,
        reservation.block,
        testUsers.find(u => u.email.includes(reservation.userId === userIds[0] ? 'test1' : 'test2'))?.name,
        testUsers.find(u => u.email.includes(reservation.userId === userIds[0] ? 'test1' : 'test2'))?.company,
        'Dirección de prueba',
        testUsers.find(u => u.email.includes(reservation.userId === userIds[0] ? 'test1' : 'test2'))?.whatsapp,
        reservation.description,
        'confirmada',
        reservationId,
        new Date().toISOString(),
        new Date().toISOString(),
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [reservationRow],
        },
      });

      console.log(`✅ Reserva creada: ${reservation.date} - ${reservation.block} para ${reservation.userId}`);
    }

    console.log('');
    console.log('🎯 Usuarios de prueba listos:');
    console.log(`📧 Usuario 1: ${testUsers[0].email} | 🔑 Contraseña: ${testUsers[0].password}`);
    console.log(`📧 Usuario 2: ${testUsers[1].email} | 🔑 Contraseña: ${testUsers[1].password}`);
    console.log(`📅 Límite: ${testUsers[0].monthlyLimit} reservas/mes cada uno`);
    console.log('');
    console.log('📋 Reservas creadas:');
    console.log(`1. Usuario 1 - ${reservations[0].date} - ${reservations[0].block} (${reservations[0].description})`);
    console.log(`2. Usuario 1 - ${reservations[1].date} - ${reservations[1].block} (${reservations[1].description})`);
    console.log(`3. Usuario 2 - ${reservations[2].date} - ${reservations[2].block} (${reservations[2].description})`);
    console.log('');
    console.log('🔍 PRUEBAS A REALIZAR:');
    console.log('');
    console.log('1️⃣ VERIFICACIÓN DE DISPONIBILIDAD AL SELECCIONAR FECHA:');
    console.log('   - Ve a http://localhost:3000/client/login');
    console.log('   - Usa las credenciales del Usuario 1');
    console.log('   - Selecciona la fecha de próxima semana');
    console.log('   - ✅ DEBERÍA: Mostrar que el bloque de tarde NO está disponible');
    console.log('   - ✅ DEBERÍA: Mostrar que el bloque de mañana SÍ está disponible');
    console.log('');
    console.log('2️⃣ PREVENCIÓN DE RESERVAS DUPLICADAS:');
    console.log('   - Intenta hacer una reserva en el mismo día y bloque que el Usuario 2');
    console.log('   - ✅ DEBERÍA: Mostrar "El bloque de tarde ya está ocupado"');
    console.log('');
    console.log('3️⃣ CANCELACIONES Y ACTUALIZACIÓN:');
    console.log('   - Ve a "Mis Reservas"');
    console.log('   - Cancela la reserva de próxima semana (la que SÍ se puede cancelar)');
    console.log('   - ✅ DEBERÍA:');
    console.log('     * Mostrar "Reserva cancelada exitosamente"');
    console.log('     * Actualizar inmediatamente el contador de reservas del mes');
    console.log('     * Cambiar el estado a "Cancelada" en la interfaz');
    console.log('     * Permitir hacer una nueva reserva (ya que liberó el límite)');
    console.log('');
    console.log('4️⃣ LÍMITE MENSUAL CORRECTO:');
    console.log('   - Intenta hacer una nueva reserva');
    console.log('   - ✅ DEBERÍA: Permitir hacer la reserva (ya que cancelaste una)');
    console.log('   - Si intentas hacer otra, debería mostrar el límite alcanzado');
    console.log('');
    console.log('5️⃣ VERIFICACIÓN DE FECHAS:');
    console.log('   - Las fechas deben mostrarse correctamente (no un día antes)');
    console.log('   - Los días pasados deben estar deshabilitados');
    console.log('   - Solo lunes a viernes deben estar disponibles');

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUsersForFinalFixes();
}

module.exports = { createTestUsersForFinalFixes };
