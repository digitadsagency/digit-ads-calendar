import { NextRequest, NextResponse } from 'next/server';
import { cancelReservation } from '@/lib/sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId } = body;

    // Validar que se proporcione el ID de reserva
    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID de reserva es requerido' },
        { status: 400 }
      );
    }

    // Cancelar reserva en Sheets
    await cancelReservation(reservationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
