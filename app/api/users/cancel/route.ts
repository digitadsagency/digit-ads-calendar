import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { google } from 'googleapis';

const SHEETS_API_VERSION = 'v4';
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

// Verificar si se puede cancelar (hasta 24 horas antes)
function canCancelReservation(reservationDate: string): { canCancel: boolean; reason?: string } {
  const now = new Date();
  const reservationDateTime = new Date(reservationDate + 'T00:00:00');
  
  // Calcular diferencia en horas
  const diffInHours = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return {
      canCancel: false,
      reason: 'Solo puedes cancelar reservas con al menos 24 horas de anticipación'
    };
  }
  
  return { canCancel: true };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID de reserva requerido' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'Google Sheets no configurado' },
        { status: 500 }
      );
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Obtener todas las reservas para encontrar la específica
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:M`,
    });

    const rows = response.data.values || [];
    const reservationRowIndex = rows.findIndex(row => 
      row.length >= 13 && row[0] === reservationId && row[1] === user.userId
    );

    if (reservationRowIndex === -1) {
      return NextResponse.json(
        { error: 'Reserva no encontrada o no tienes permisos para cancelarla' },
        { status: 404 }
      );
    }

    const reservation = rows[reservationRowIndex];
    const reservationDate = reservation[2]; // fecha
    const currentStatus = reservation[9]; // estado

    console.log('🔍 Verificando estado de reserva:', {
      reservationId,
      userId: user.userId,
      currentStatus,
      statusType: typeof currentStatus,
      isCanceled: currentStatus === 'cancelada',
      rowData: reservation
    });

    // Verificar si ya está cancelada
    if (currentStatus === 'cancelada') {
      console.log('❌ Reserva ya cancelada, no se puede cancelar de nuevo');
      return NextResponse.json(
        { error: 'Esta reserva ya está cancelada' },
        { status: 400 }
      );
    }

    // Verificar si se puede cancelar (24 horas antes)
    const cancelCheck = canCancelReservation(reservationDate);
    if (!cancelCheck.canCancel) {
      return NextResponse.json(
        { error: cancelCheck.reason },
        { status: 400 }
      );
    }

    // Actualizar el estado a cancelada
    // reservationRowIndex es el índice en el array (0-based), pero Google Sheets usa 1-based
    // Como obtenemos desde A:M (incluye header), necesitamos +1 para la fila correcta
    const actualRowIndex = reservationRowIndex + 1;
    const now = new Date().toISOString();
    
    console.log('Actualizando reserva:', {
      reservationId,
      userId: user.userId,
      reservationRowIndex,
      actualRowIndex,
      currentStatus,
      newStatus: 'cancelada'
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!J${actualRowIndex}:J${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['cancelada']], // Solo cambiar el estado
      },
    });

    // Actualizar también la fecha de actualización
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!M${actualRowIndex}:M${actualRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[now]], // Solo actualizar la fecha de modificación
      },
    });

    console.log('Reserva de usuario cancelada exitosamente:', { reservationId, userId: user.userId });

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
    });
  } catch (error) {
    console.error('Error cancelando reserva de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
