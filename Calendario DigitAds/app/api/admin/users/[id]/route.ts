import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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

// Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'Google Sheets no configurado' },
        { status: 500 }
      );
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    console.log('🔍 Intentando eliminar usuario:', userId);

    // Primero, obtener información de las pestañas para encontrar el sheetId correcto
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const usuariosSheet = spreadsheetInfo.data.sheets?.find(
      sheet => sheet.properties?.title === USERS_SHEET_NAME
    );

    if (!usuariosSheet?.properties?.sheetId) {
      console.error('❌ No se encontró la pestaña de usuarios');
      return NextResponse.json(
        { error: 'Pestaña de usuarios no encontrada' },
        { status: 404 }
      );
    }

    const sheetId = usuariosSheet.properties.sheetId;
    console.log('📋 Sheet ID encontrado:', sheetId);

    // Obtener todos los usuarios para encontrar la fila
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    console.log('📊 Total de filas encontradas:', rows.length);

    const userRowIndex = rows.findIndex((row, index) => {
      console.log(`🔍 Fila ${index + 1}:`, {
        length: row.length,
        id: row[0],
        matches: row.length >= 10 && row[0] === userId
      });
      return row.length >= 10 && row[0] === userId;
    });

    if (userRowIndex === -1) {
      console.error('❌ Usuario no encontrado en las filas');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Usuario encontrado en fila:', userRowIndex + 1);

    // La fila real en Google Sheets (empezando desde 0, +1 por el header)
    const actualRowIndex = userRowIndex + 1;
    console.log('🗑️ Eliminando fila:', actualRowIndex);

    // Primero, limpiar el contenido de la fila
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A${actualRowIndex + 1}:J${actualRowIndex + 1}`,
    });

    // Luego, eliminar la fila usando el sheetId correcto
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

    console.log('✅ Usuario eliminado exitosamente:', userId);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
