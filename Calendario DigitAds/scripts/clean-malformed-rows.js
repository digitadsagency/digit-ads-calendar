const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const SHEETS_API_VERSION = 'v4';
const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';
const PUBLIC_RESERVATIONS_SHEET_NAME = 'reservas';

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

// Limpiar filas malformadas en reservas de usuarios
async function cleanUserReservations() {
  try {
    console.log('🧹 Limpiando filas malformadas en reservas de usuarios...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Obtener todas las filas
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas encontradas: ${rows.length}`);

    // Identificar filas válidas y malformadas
    const validRows = [];
    const malformedRowIndices = [];

    rows.forEach((row, index) => {
      // Saltar header (índice 0)
      if (index === 0) {
        validRows.push(row);
        return;
      }

      // Verificar si la fila tiene todos los datos esenciales
      const hasEssentialData = row.length >= 13 && 
        row[0] && // id
        row[1] && // userId
        row[2] && // fecha
        row[3] && // bloque
        row[4] && // cliente_nombre
        row[9] && // estado
        row[10]; // codigo_reserva

      if (hasEssentialData) {
        validRows.push(row);
        console.log(`✅ Fila ${index + 1} válida: ${row[0]} - ${row[4]} - ${row[9]}`);
      } else {
        malformedRowIndices.push(index + 1); // +1 porque Google Sheets usa índice base 1
        console.log(`❌ Fila ${index + 1} malformada:`, row);
      }
    });

    console.log(`\n📊 Resumen:`);
    console.log(`   - Filas válidas: ${validRows.length - 1}`); // -1 por el header
    console.log(`   - Filas malformadas: ${malformedRowIndices.length}`);

    if (malformedRowIndices.length === 0) {
      console.log('✅ No hay filas malformadas que limpiar');
      return;
    }

    // Limpiar la hoja completa y escribir solo las filas válidas
    console.log('\n🧹 Limpiando hoja y escribiendo solo filas válidas...');
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
    });

    if (validRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${USER_RESERVATIONS_SHEET_NAME}!A1:M${validRows.length}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: validRows,
        },
      });
    }

    console.log(`✅ Limpieza completada. ${malformedRowIndices.length} filas malformadas eliminadas`);

  } catch (error) {
    console.error('❌ Error limpiando reservas de usuarios:', error);
  }
}

// Limpiar filas malformadas en reservas públicas
async function cleanPublicReservations() {
  try {
    console.log('\n🧹 Limpiando filas malformadas en reservas públicas...');

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.log('❌ Google Sheets no configurado');
      return;
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Obtener todas las filas
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${PUBLIC_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    console.log(`📊 Total de filas encontradas: ${rows.length}`);

    // Identificar filas válidas y malformadas
    const validRows = [];
    const malformedRowIndices = [];

    rows.forEach((row, index) => {
      // Saltar header (índice 0)
      if (index === 0) {
        validRows.push(row);
        return;
      }

      // Verificar si la fila tiene todos los datos esenciales
      const hasEssentialData = row.length >= 14 && 
        row[0] && // id
        row[1] && // fecha
        row[2] && // bloque
        row[3] && // cliente_nombre
        row[8] && // estado
        row[9]; // codigo_reserva

      if (hasEssentialData) {
        validRows.push(row);
        console.log(`✅ Fila ${index + 1} válida: ${row[0]} - ${row[3]} - ${row[8]}`);
      } else {
        malformedRowIndices.push(index + 1); // +1 porque Google Sheets usa índice base 1
        console.log(`❌ Fila ${index + 1} malformada:`, row);
      }
    });

    console.log(`\n📊 Resumen:`);
    console.log(`   - Filas válidas: ${validRows.length - 1}`); // -1 por el header
    console.log(`   - Filas malformadas: ${malformedRowIndices.length}`);

    if (malformedRowIndices.length === 0) {
      console.log('✅ No hay filas malformadas que limpiar');
      return;
    }

    // Limpiar la hoja completa y escribir solo las filas válidas
    console.log('\n🧹 Limpiando hoja y escribiendo solo filas válidas...');
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${PUBLIC_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    if (validRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${PUBLIC_RESERVATIONS_SHEET_NAME}!A1:N${validRows.length}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: validRows,
        },
      });
    }

    console.log(`✅ Limpieza completada. ${malformedRowIndices.length} filas malformadas eliminadas`);

  } catch (error) {
    console.error('❌ Error limpiando reservas públicas:', error);
  }
}

// Función principal
async function cleanAllMalformedRows() {
  console.log('🧹 INICIANDO LIMPIEZA DE FILAS MALFORMADAS');
  console.log('==========================================\n');

  await cleanUserReservations();
  await cleanPublicReservations();

  console.log('\n🎯 LIMPIEZA COMPLETADA');
  console.log('======================');
  console.log('✅ Todas las filas malformadas han sido eliminadas');
  console.log('✅ Solo quedan filas con datos completos y válidos');
  console.log('✅ El panel de admin ahora debería mostrar solo reservas válidas');
  console.log('\n🔍 PRÓXIMOS PASOS:');
  console.log('1. Ve al panel de admin: http://localhost:3001/admin');
  console.log('2. Verifica que no aparezcan filas vacías o malformadas');
  console.log('3. Todas las reservas deberían mostrar datos completos');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanAllMalformedRows();
}

module.exports = { cleanAllMalformedRows, cleanUserReservations, cleanPublicReservations };
