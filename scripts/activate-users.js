const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function activateUsers() {
  try {
    console.log('🔧 Activando usuarios...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Obtener usuarios actuales
    console.log('\n1️⃣ Obteniendo usuarios actuales...');
    
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'usuarios!A:F',
    });

    const userRows = usersResponse.data.values || [];
    console.log(`📊 Total de usuarios: ${userRows.length}`);

    // 2. Activar todos los usuarios
    console.log('\n2️⃣ Activando usuarios...');
    
    const usersToActivate = [];
    userRows.forEach((row, index) => {
      if (index > 0 && row.length >= 6) { // Saltar header
        const userId = row[0];
        const email = row[1];
        const name = row[2];
        const company = row[3];
        const monthlyLimit = row[4] || '3';
        const isActive = 'true'; // Activar todos los usuarios
        
        if (userId && email) {
          usersToActivate.push([userId, email, name, company, monthlyLimit, isActive]);
          console.log(`✅ Activando usuario: ${userId} - ${email}`);
        }
      }
    });

    // 3. Actualizar Google Sheets
    if (usersToActivate.length > 0) {
      console.log(`\n3️⃣ Actualizando ${usersToActivate.length} usuarios en Google Sheets...`);
      
      // Limpiar la hoja de usuarios (excepto el header)
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: 'usuarios!A2:F1000',
      });

      // Agregar los usuarios activados
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'usuarios!A2:F1000',
        valueInputOption: 'RAW',
        requestBody: {
          values: usersToActivate,
        },
      });

      console.log('✅ Usuarios activados exitosamente');
    } else {
      console.log('❌ No hay usuarios para activar');
    }

    // 4. Verificar el resultado
    console.log('\n4️⃣ Verificando resultado...');
    
    const updatedResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'usuarios!A:F',
    });

    const updatedRows = updatedResponse.data.values || [];
    console.log(`📊 Total de usuarios después de la actualización: ${updatedRows.length}`);

    updatedRows.forEach((row, index) => {
      if (index > 0 && row.length >= 6) { // Saltar header
        const userId = row[0];
        const email = row[1];
        const isActive = row[5];
        console.log(`👤 ${userId} - ${email} - Activo: ${isActive}`);
      }
    });

    console.log('\n🎉 Proceso de activación completado');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  activateUsers();
}

module.exports = { activateUsers };
