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

async function cleanGhostUser() {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
      return;
    }

    console.log('🔍 INVESTIGANDO USUARIO FANTASMA...\n');

    // Leer usuarios actuales
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'usuarios!A:J',
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas en Google Sheets: ${rows.length}`);

    // Mostrar todas las filas para identificar el problema
    console.log('\n📋 TODAS LAS FILAS EN GOOGLE SHEETS:');
    rows.forEach((row, index) => {
      console.log(`Fila ${index + 1}:`, {
        length: row.length,
        content: row.slice(0, 5), // Primeros 5 elementos
        fullContent: row
      });
    });

    // Buscar filas problemáticas
    const problematicRows = [];
    rows.forEach((row, index) => {
      // Buscar filas que tengan "id" como primer elemento (que no sea el header)
      if (index > 0 && row.length > 0 && row[0] === 'id') {
        problematicRows.push({ index, row });
      }
    });

    if (problematicRows.length === 0) {
      console.log('✅ No se encontraron filas problemáticas en Google Sheets');
      console.log('🔍 El problema puede estar en el cache de la aplicación o en otra parte');
      return;
    }

    console.log(`\n🚨 FILAS PROBLEMÁTICAS ENCONTRADAS: ${problematicRows.length}`);
    problematicRows.forEach(({ index, row }) => {
      console.log(`  - Fila ${index + 1}:`, row);
    });

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

    // Eliminar filas problemáticas (empezando desde la última para no afectar los índices)
    const rowsToDelete = problematicRows.sort((a, b) => b.index - a.index);
    
    for (const { index } of rowsToDelete) {
      const actualRowIndex = index + 1; // +1 porque Google Sheets empieza desde 1
      console.log(`🗑️ Eliminando fila problemática ${index + 1} (fila real: ${actualRowIndex})`);

      // Primero, limpiar el contenido de la fila
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `usuarios!A${actualRowIndex}:J${actualRowIndex}`,
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
                startIndex: actualRowIndex - 1,
                endIndex: actualRowIndex,
              },
            },
          }],
        },
      });

      console.log(`✅ Fila ${index + 1} eliminada exitosamente`);
    }

    // Verificar que se eliminaron
    console.log('\n🔍 VERIFICANDO DESPUÉS DE LA LIMPIEZA...\n');

    const responseAfter = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'usuarios!A:J',
    });

    const rowsAfter = responseAfter.data.values || [];
    console.log(`📊 Total de filas después de la limpieza: ${rowsAfter.length}`);

    // Mostrar filas restantes
    console.log('\n📋 FILAS RESTANTES:');
    rowsAfter.forEach((row, index) => {
      console.log(`Fila ${index + 1}:`, {
        length: row.length,
        content: row.slice(0, 5), // Primeros 5 elementos
      });
    });

    // Verificar si quedan filas problemáticas
    const remainingProblematicRows = rowsAfter.filter((row, index) => {
      return index > 0 && row.length > 0 && row[0] === 'id';
    });

    if (remainingProblematicRows.length === 0) {
      console.log('✅ Todas las filas problemáticas fueron eliminadas exitosamente');
    } else {
      console.log(`❌ Aún quedan ${remainingProblematicRows.length} filas problemáticas`);
    }

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanGhostUser();
}

module.exports = { cleanGhostUser };
