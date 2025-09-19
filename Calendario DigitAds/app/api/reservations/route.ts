import { NextRequest, NextResponse } from 'next/server';
import { getAllReservations, getReservationsByDate } from '@/lib/sheets';
import { Reservation } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let reservations: Reservation[];

    if (date) {
      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      reservations = await getReservationsByDate(date);
      console.log(`📊 API Reservas - Filtro por fecha ${date}: ${reservations.length} reservas`);
    } else {
      reservations = await getAllReservations();
      console.log(`📊 API Reservas - Todas las reservas: ${reservations.length} reservas`);
      console.log('📊 API Reservas - Detalles:', reservations.map(r => ({ 
        id: r.id, 
        fecha: r.fecha, 
        estado: r.estado,
        cliente: r.cliente_nombre 
      })));
    }

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
