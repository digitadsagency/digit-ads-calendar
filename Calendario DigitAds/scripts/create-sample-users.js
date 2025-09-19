const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';

// Headers para la pestaña de usuarios
const USERS_HEADERS = [
  'id', 'email', 'password', 'name', 'company', 'monthlyLimit', 
  'whatsapp', 'created_at', 'last_login', 'is_active'
];

// Usuarios de ejemplo
const sampleUsers = [
  {
    email: 'cliente1@empresa.com',
    password: 'cliente123',
    name: 'María González',
    company: 'Empresa ABC',
    monthlyLimit: 3,
    whatsapp: '+52 55 1234 5678',
  },
  {
    email: 'cliente2@marca.com',
    password: 'cliente456',
    name: 'Carlos Rodríguez',
    company: 'Marca XYZ',
    monthlyLimit: 3,
    whatsapp: '+52 55 2345 6789',
  },
  {
    email: 'cliente3@startup.com',
    password: 'cliente789',
    name: 'Ana Martínez',
    company: 'Startup Tech',
    monthlyLimit: 1,
    whatsapp: '+52 55 3456 7890',
  },
  {
    email: 'cliente4@negocio.com',
    password: 'cliente012',
    name: 'Luis Hernández',
    company: 'Negocio Local',
    monthlyLimit: 1,
    whatsapp: '+52 55 4567 8901',
  },
  {
    email: 'cliente5@corporativo.com',
    password: 'cliente345',
    name: 'Sofia López',
    company: 'Corporativo Global',
    monthlyLimit: 1,
    whatsapp: '+52 55 5678 9012',
  },
];

// Función para generar ID único
function generateUserId() {
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `USR-${randomString}`;
}

// Función para hash simple de contraseña (ahora guardamos tal cual)
function hashPassword(password) {
  return password; // Guardamos la contraseña tal cual para facilitar testing
}

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

// Asegurar que la pestaña de usuarios esté configurada
async function ensureUsersSheetSetup() {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log('Google Sheets no configurado, no se pueden crear usuarios');
    return false;
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Verificar si la pestaña existe
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheets = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];

    // Crear pestaña de usuarios si no existe
    if (!existingSheets.includes(USERS_SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: USERS_SHEET_NAME,
              },
            },
          }],
        },
      });

      // Agregar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${USERS_SHEET_NAME}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [USERS_HEADERS],
        },
      });

      console.log('Pestaña de usuarios creada');
    }

    return true;
  } catch (error) {
    console.error('Error configurando pestaña de usuarios:', error);
    return false;
  }
}

// Crear usuarios de ejemplo
async function createSampleUsers() {
  try {
    console.log('🚀 Iniciando creación de usuarios de ejemplo...');

    const isSetup = await ensureUsersSheetSetup();
    if (!isSetup) {
      console.log('❌ No se pudo configurar Google Sheets');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const now = new Date().toISOString();

    // Preparar filas para insertar
    const rows = sampleUsers.map(user => [
      generateUserId(),
      user.email,
      hashPassword(user.password),
      user.name,
      user.company,
      user.monthlyLimit,
      user.whatsapp,
      now,
      '', // last_login vacío
      true, // is_active
    ]);

    // Insertar todos los usuarios
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });

    console.log('✅ Usuarios de ejemplo creados exitosamente:');
    console.log('');
    
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.company})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Contraseña: ${user.password}`);
      console.log(`   Límite mensual: ${user.monthlyLimit} reserva(s)`);
      console.log(`   WhatsApp: ${user.whatsapp}`);
      console.log('');
    });

    console.log('🔗 Los clientes pueden acceder en: /client');
    console.log('📧 Comparte estas credenciales con tus clientes');

  } catch (error) {
    console.error('❌ Error creando usuarios de ejemplo:', error);
    if (error.message.includes('No se puede acceder al spreadsheet')) {
      console.log('');
      console.log('💡 Asegúrate de:');
      console.log('1. Tener configurado GOOGLE_SHEETS_SPREADSHEET_ID en .env.local');
      console.log('2. Haber compartido el spreadsheet con tu service account');
      console.log('3. Tener configuradas las credenciales de Google Sheets');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSampleUsers();
}

module.exports = { createSampleUsers };
