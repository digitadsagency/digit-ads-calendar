const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';

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

// Probar la conexión y crear un usuario de prueba
async function testAuth() {
  try {
    console.log('🧪 Probando sistema de autenticación...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // 1. Verificar que podemos leer la pestaña
    console.log('📖 Leyendo pestaña de usuarios...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    console.log(`✅ Pestaña leída correctamente. Filas encontradas: ${rows.length}`);

    // 2. Crear un usuario de prueba
    console.log('👤 Creando usuario de prueba...');
    const testUser = {
      email: 'test@ejemplo.com',
      password: 'test123',
      name: 'Usuario Prueba',
      company: 'Empresa Prueba',
      monthlyLimit: 1,
      whatsapp: '+52 55 0000 0000',
    };

    const id = generateUserId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      testUser.email,
      testUser.password, // Sin hash, tal como se escribe
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

    console.log('✅ Usuario de prueba creado exitosamente');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);

    // 3. Verificar que podemos leer el usuario creado
    console.log('🔍 Verificando que el usuario se puede leer...');
    const response2 = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows2 = response2.data.values || [];
    const userRow = rows2.find(row => row.length >= 10 && row[1] === testUser.email);
    
    if (userRow) {
      console.log('✅ Usuario encontrado en la base de datos:');
      console.log(`   ID: ${userRow[0]}`);
      console.log(`   Email: ${userRow[1]}`);
      console.log(`   Contraseña: ${userRow[2]}`);
      console.log(`   Nombre: ${userRow[3]}`);
      console.log(`   Empresa: ${userRow[4]}`);
      console.log(`   Límite: ${userRow[5]}`);
      console.log(`   Activo: ${userRow[9]}`);
    } else {
      console.log('❌ Usuario no encontrado después de crearlo');
    }

    console.log('');
    console.log('🎯 Prueba completada. Ahora puedes:');
    console.log('1. Ir a /client/login');
    console.log('2. Usar email: test@ejemplo.com');
    console.log('3. Usar contraseña: test123');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };
