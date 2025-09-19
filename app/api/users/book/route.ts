import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { canUserMakeReservation, createUserReservation, getAllUserReservationsForAvailability } from '@/lib/users';
import { getReservationsByDate } from '@/lib/sheets';
import { sendBookingConfirmation } from '@/lib/email';
import { BookingRequest } from '@/lib/types';

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

    const body: BookingRequest = await request.json();
    const { date, block, timeSlot, name, brand, direccion_grabacion, correo, notes } = body;

    // Validaciones básicas
    if (!date || !block || !timeSlot || !name || !brand || !direccion_grabacion || !correo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el usuario puede hacer la reserva (límite mensual)
    const canReserve = await canUserMakeReservation(user.userId, date);
    if (!canReserve) {
      const [year, month] = date.split('-').map(Number);
      const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long' });
      
      return NextResponse.json(
        { 
          error: `Has alcanzado tu límite mensual de ${user.monthlyLimit} reserva(s) para ${monthName}. Intenta en el próximo mes o contacta al administrador si necesitas más reservas.`,
          limitReached: true,
          monthlyLimit: user.monthlyLimit,
          currentMonth: monthName
        },
        { status: 400 }
      );
    }

    // Verificar disponibilidad del bloque
    try {
      // Verificar reservas públicas
      const publicReservations = await getReservationsByDate(date);
      const publicBlockTaken = publicReservations.some(r => r.bloque === block && r.estado === 'confirmada');
      
      // Verificar reservas de usuarios
      const userReservations = await getAllUserReservationsForAvailability();
      const userReservationsForDate = userReservations.filter(r => r.fecha === date);
      const userBlockTaken = userReservationsForDate.some(r => r.bloque === block && r.estado === 'confirmada');
      
      if (publicBlockTaken || userBlockTaken) {
        return NextResponse.json(
          { 
            error: `El bloque de ${block.toLowerCase()} ya está ocupado para esta fecha. Por favor selecciona otro horario.`,
            blockUnavailable: true
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      // Continuar con la reserva si no se puede verificar la disponibilidad
    }

    // Crear reserva
    const { id, codigo_reserva } = await createUserReservation(user.userId, {
      date,
      block,
      timeSlot,
      name,
      brand,
      direccion_grabacion,
      correo: correo || '',
      notes: notes || '',
    });

    // Enviar correo de confirmación
    try {
      const emailResult = await sendBookingConfirmation({
        cliente_nombre: name,
        empresa_marca: brand,
        fecha: date,
        bloque: block,
        horario: timeSlot,
        direccion_grabacion,
        codigo_reserva,
        correo,
        notas: notes || '',
      });

      if (!emailResult.success) {
        console.warn('⚠️ No se pudo enviar el correo de confirmación:', emailResult.error);
        // No fallar la reserva si el correo falla
      }
    } catch (emailError) {
      console.warn('⚠️ Error enviando correo de confirmación:', emailError);
      // No fallar la reserva si el correo falla
    }

    return NextResponse.json({
      success: true,
      code: codigo_reserva,
      reservationId: id,
      message: 'Reserva creada exitosamente',
    });
  } catch (error) {
    console.error('Error creando reserva de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
