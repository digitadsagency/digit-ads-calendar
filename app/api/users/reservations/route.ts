import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllUserReservationsWithCancelled } from '@/lib/users';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener reservas del usuario
    const reservations = await getAllUserReservationsWithCancelled(user.userId);

    console.log('📊 API Reservas - Usuario:', user.userId);
    console.log('📊 API Reservas - Total encontradas:', reservations.length);
    console.log('📊 API Reservas - Detalles:', reservations.map(r => ({ 
      id: r.id, 
      estado: r.estado, 
      fecha: r.fecha,
      codigo: r.codigo_reserva 
    })));

    return NextResponse.json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error('Error obteniendo reservas del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
