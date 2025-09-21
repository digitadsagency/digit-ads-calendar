const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function cleanAllReservations() {
  try {
    console.log('🧹 Limpiando todas las reservas...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Limpiar reservas de usuarios
    console.log('\n1️⃣ Limpiando reservas de usuarios...');
    try {
      // Obtener información de las pestañas para encontrar el sheetId correcto
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const usuariosSheet = spreadsheetInfo.data.sheets?.find(
        sheet => sheet.properties?.title === 'reservas_usuarios'
      );
      
      if (usuariosSheet?.properties?.sheetId) {
        const sheetId = usuariosSheet.properties.sheetId;
        console.log('📋 Sheet ID de reservas_usuarios:', sheetId);
        
        // Obtener todas las filas para contar cuántas eliminar
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'reservas_usuarios!A:N',
        });
        
        const rows = response.data.values || [];
        console.log(`📊 Total de filas en reservas_usuarios: ${rows.length}`);
        
        if (rows.length > 1) { // Más que solo el header
          // Eliminar todas las filas excepto el header
          const rowsToDelete = rows.length - 1;
          console.log(`🗑️ Eliminando ${rowsToDelete} filas de reservas de usuarios...`);
          
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: 1, // Empezar desde la fila 2 (después del header)
                    endIndex: rows.length, // Hasta la última fila
                  },
                },
              }],
            },
          });
          
          console.log('✅ Reservas de usuarios eliminadas');
        } else {
          console.log('ℹ️ No hay reservas de usuarios para eliminar');
        }
      } else {
        console.log('❌ No se encontró la pestaña de reservas_usuarios');
      }
    } catch (error) {
      console.log('❌ Error limpiando reservas de usuarios:', error.message);
    }

    // 2. Limpiar reservas públicas
    console.log('\n2️⃣ Limpiando reservas públicas...');
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const publicSheet = spreadsheetInfo.data.sheets?.find(
        sheet => sheet.properties?.title === 'reservas'
      );
      
      if (publicSheet?.properties?.sheetId) {
        const sheetId = publicSheet.properties.sheetId;
        console.log('📋 Sheet ID de reservas:', sheetId);
        
        // Obtener todas las filas para contar cuántas eliminar
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'reservas!A:N',
        });
        
        const rows = response.data.values || [];
        console.log(`📊 Total de filas en reservas: ${rows.length}`);
        
        if (rows.length > 1) { // Más que solo el header
          // Eliminar todas las filas excepto el header
          const rowsToDelete = rows.length - 1;
          console.log(`🗑️ Eliminando ${rowsToDelete} filas de reservas públicas...`);
          
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: 1, // Empezar desde la fila 2 (después del header)
                    endIndex: rows.length, // Hasta la última fila
                  },
                },
              }],
            },
          });
          
          console.log('✅ Reservas públicas eliminadas');
        } else {
          console.log('ℹ️ No hay reservas públicas para eliminar');
        }
      } else {
        console.log('❌ No se encontró la pestaña de reservas');
      }
    } catch (error) {
      console.log('❌ Error limpiando reservas públicas:', error.message);
    }

    // 3. Verificar que se limpiaron correctamente
    console.log('\n3️⃣ Verificando limpieza...');
    
    try {
      const userResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas_usuarios!A:N',
      });
      
      const publicResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'reservas!A:N',
      });
      
      const userRows = userResponse.data.values || [];
      const publicRows = publicResponse.data.values || [];
      
      console.log(`📊 Filas restantes en reservas_usuarios: ${userRows.length}`);
      console.log(`📊 Filas restantes en reservas: ${publicRows.length}`);
      
      if (userRows.length === 1 && publicRows.length === 1) {
        console.log('✅ Limpieza completada exitosamente - solo quedan los headers');
      } else {
        console.log('⚠️ Algunas filas podrían no haberse eliminado correctamente');
      }
    } catch (error) {
      console.log('❌ Error verificando limpieza:', error.message);
    }

    console.log('\n🎉 Proceso de limpieza completado');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanAllReservations();
}

module.exports = { cleanAllReservations };
