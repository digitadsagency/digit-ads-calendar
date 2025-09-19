/**
 * Script para configurar automáticamente Google Sheets
 * Ejecutar con: node scripts/setup-sheets.js
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function setupSheets() {
  try {
    console.log('🚀 Configurando Google Sheets...');

    // Configurar autenticación
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID no está configurado en .env.local');
    }

    console.log(`📊 Usando spreadsheet: ${spreadsheetId}`);

    // Verificar que el spreadsheet existe y es accesible
    try {
      await sheets.spreadsheets.get({ spreadsheetId });
      console.log('✅ Spreadsheet accesible');
    } catch (error) {
      throw new Error(`No se puede acceder al spreadsheet. Asegúrate de compartirlo con ${process.env.GOOGLE_CLIENT_EMAIL}`);
    }

    // Obtener información del spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];

    console.log(`📋 Pestañas existentes: ${existingSheets.join(', ')}`);

    // Crear pestaña de reservas si no existe
    if (!existingSheets.includes('reservas')) {
      console.log('📝 Creando pestaña "reservas"...');
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'reservas',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 14,
                },
              },
            },
          }],
        },
      });

      // Agregar headers
const reservasHeaders = [
  'id', 'fecha', 'bloque', 'cliente_nombre', 'empresa_marca', 'direccion_grabacion',
  'whatsapp', 'notas', 'estado', 'codigo_reserva', 'gcal_event_id_ph1', 
  'gcal_event_id_ph2', 'creado_en', 'actualizado_en'
];

const usuariosHeaders = [
  'id', 'email', 'password', 'name', 'company', 'monthlyLimit', 
  'whatsapp', 'created_at', 'last_login', 'is_active'
];

const reservasUsuariosHeaders = [
  'id', 'userId', 'fecha', 'bloque', 'cliente_nombre', 'empresa_marca', 
  'direccion_grabacion', 'whatsapp', 'notas', 'estado', 'codigo_reserva', 
  'creado_en', 'actualizado_en'
];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'reservas!A1:N1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [reservasHeaders],
        },
      });

      console.log('✅ Pestaña "reservas" creada con headers');
    } else {
      console.log('ℹ️  Pestaña "reservas" ya existe');
    }

    // Crear pestaña de config si no existe
    if (!existingSheets.includes('config')) {
      console.log('⚙️  Creando pestaña "config"...');
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'config',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 2,
                },
              },
            },
          }],
        },
      });

      // Agregar headers y configuración por defecto
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'config!A1:B1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['key', 'value']],
        },
      });

      const defaultConfig = [
        ['morning_start', '10:00'],
        ['morning_end', '13:00'],
        ['afternoon_start', '16:00'],
        ['afternoon_end', '19:00'],
        ['enabled_weekdays', '1,2,3,4,5'],
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'config!A2:B6',
        valueInputOption: 'RAW',
        requestBody: {
          values: defaultConfig,
        },
      });

      console.log('✅ Pestaña "config" creada con configuración por defecto');
    } else {
      console.log('ℹ️  Pestaña "config" ya existe');
    }

    // Crear pestaña de usuarios si no existe
    if (!existingSheets.includes('usuarios')) {
      console.log('👥 Creando pestaña "usuarios"...');
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'usuarios',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 10,
                },
              },
            },
          }],
        },
      });

      // Agregar headers de usuarios
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'usuarios!A1:J1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [usuariosHeaders],
        },
      });

      console.log('✅ Pestaña "usuarios" creada con headers');
    } else {
      console.log('ℹ️  Pestaña "usuarios" ya existe');
    }

    // Crear pestaña de reservas_usuarios si no existe
    if (!existingSheets.includes('reservas_usuarios')) {
      console.log('📅 Creando pestaña "reservas_usuarios"...');
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'reservas_usuarios',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 13,
                },
              },
            },
          }],
        },
      });

      // Agregar headers de reservas_usuarios
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'reservas_usuarios!A1:M1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [reservasUsuariosHeaders],
        },
      });

      console.log('✅ Pestaña "reservas_usuarios" creada con headers');
    } else {
      console.log('ℹ️  Pestaña "reservas_usuarios" ya existe');
    }

    console.log('🎉 ¡Configuración de Google Sheets completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Verifica que las pestañas se crearon correctamente');
    console.log('2. Asegúrate de que los calendarios de los fotógrafos estén compartidos con el Service Account');
    console.log('3. Ejecuta "pnpm dev" para iniciar la aplicación');

  } catch (error) {
    console.error('❌ Error configurando Google Sheets:', error.message);
    process.exit(1);
  }
}

setupSheets();
