const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Configuración de autenticación
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// Obtener instancia de Sheets API
async function getSheets() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

async function testDeleteUser() {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
      return;
    }

    console.log('🔍 VERIFICANDO USUARIOS ANTES DE LA ELIMINACIÓN...\n');

    // Leer usuarios actuales
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'usuarios!A:J',
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de usuarios encontrados: ${rows.length}`);

    // Mostrar usuarios existentes
    rows.forEach((row, index) => {
      if (index === 0) {
        console.log('📋 Headers:', row.join(', '));
      } else if (row.length >= 10) {
        console.log(`👤 Usuario ${index}:`, {
          id: row[0],
          email: row[1],
          name: row[2],
          company: row[3],
          monthlyLimit: row[4],
          is_active: row[9]
        });
      }
    });

    // Buscar un usuario para eliminar (excluyendo headers)
    const usersToDelete = rows.filter((row, index) => index > 0 && row.length >= 10);
    
    if (usersToDelete.length === 0) {
      console.log('❌ No hay usuarios para eliminar');
      return;
    }

    const userToDelete = usersToDelete[0];
    const userId = userToDelete[0];
    const userName = userToDelete[2];

    console.log('🎯 Usuario seleccionado para eliminar:', {
      id: userId,
      name: userName,
      email: userToDelete[1]
    });

    console.log(`\n🗑️ ELIMINANDO USUARIO: ${userName} (ID: ${userId})`);

    // Obtener información de las pestañas
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const usuariosSheet = spreadsheetInfo.data.sheets?.find(
      sheet => sheet.properties?.title === 'usuarios'
    );

    if (!usuariosSheet?.properties?.sheetId) {
      console.error('❌ No se encontró la pestaña de usuarios');
      return;
    }

    const sheetId = usuariosSheet.properties.sheetId;
    console.log('📋 Sheet ID encontrado:', sheetId);

    // Encontrar la fila del usuario
    const userRowIndex = rows.findIndex((row, index) => {
      return index > 0 && row.length >= 10 && row[0] === userId;
    });

    if (userRowIndex === -1) {
      console.error('❌ Usuario no encontrado en las filas');
      return;
    }

    console.log('✅ Usuario encontrado en fila:', userRowIndex + 1);

    // La fila real en Google Sheets (empezando desde 0, +1 por el header)
    const actualRowIndex = userRowIndex + 1;
    console.log('🗑️ Eliminando fila:', actualRowIndex);

    // Primero, limpiar el contenido de la fila
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `usuarios!A${actualRowIndex + 1}:J${actualRowIndex + 1}`,
    });

    // Luego, eliminar la fila
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: actualRowIndex,
              endIndex: actualRowIndex + 1,
            },
          },
        }],
      },
    });

    console.log('✅ Usuario eliminado exitosamente');

    // Verificar que se eliminó
    console.log('\n🔍 VERIFICANDO DESPUÉS DE LA ELIMINACIÓN...\n');

    const responseAfter = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'usuarios!A:J',
    });

    const rowsAfter = responseAfter.data.values || [];
    console.log(`📊 Total de usuarios después: ${rowsAfter.length}`);

    // Mostrar usuarios restantes
    console.log('👥 Usuarios restantes:');
    rowsAfter.forEach((row, index) => {
      if (index === 0) {
        console.log('📋 Headers:', row.join(', '));
      } else if (row.length >= 10) {
        console.log(`👤 Usuario ${index}:`, {
          id: row[0],
          email: row[1],
          name: row[2],
          company: row[3]
        });
      }
    });

    const userStillExists = rowsAfter.some((row, index) => {
      return index > 0 && row.length >= 10 && row[0] === userId;
    });

    if (userStillExists) {
      console.log(`❌ El usuario ${userId} aún existe después de la eliminación`);
    } else {
      console.log(`✅ El usuario ${userId} fue eliminado correctamente`);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testDeleteUser();
}

module.exports = { testDeleteUser };
