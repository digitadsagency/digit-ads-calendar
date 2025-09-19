import { NextRequest, NextResponse } from 'next/server';
import { isDateAvailable } from '@/lib/date';
import { AvailabilityResponse } from '@/lib/types';
import { getReservationsByDate } from '@/lib/sheets';
import { getAllUserReservationsForAvailability } from '@/lib/users';

// Simulación de disponibilidad para desarrollo (fallback)
const mockReservations = new Map<string, { morning: boolean; afternoon: boolean }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    // Validar que se proporcione la fecha
    if (!date) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      );
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Verificar que la fecha sea un día hábil
    if (!isDateAvailable(date)) {
      return NextResponse.json({
        success: true,
        morningAvailable: false, 
        afternoonAvailable: false 
      });
    }

    // Verificar disponibilidad
    let morningAvailable = true;
    let afternoonAvailable = true;
    
    try {
      // Verificar reservas públicas
      const publicReservations = await getReservationsByDate(date);
      const publicMorningReservations = publicReservations.filter(r => r.bloque === 'Mañana' && r.estado === 'confirmada');
      const publicAfternoonReservations = publicReservations.filter(r => r.bloque === 'Tarde' && r.estado === 'confirmada');
      
      // Verificar reservas de usuarios
      const userReservations = await getAllUserReservationsForAvailability();
      const userReservationsForDate = userReservations.filter(r => r.fecha === date);
      const userMorningReservations = userReservationsForDate.filter(r => r.bloque === 'Mañana' && r.estado === 'confirmada');
      const userAfternoonReservations = userReservationsForDate.filter(r => r.bloque === 'Tarde' && r.estado === 'confirmada');
      
      // Combinar todas las reservas
      const allMorningReservations = [...publicMorningReservations, ...userMorningReservations];
      const allAfternoonReservations = [...publicAfternoonReservations, ...userAfternoonReservations];
      
      // Un bloque está disponible solo si NO tiene ninguna reserva
      // Si hay al menos una reserva en el bloque, se cierra todo el bloque
      morningAvailable = allMorningReservations.length === 0;
      afternoonAvailable = allAfternoonReservations.length === 0;
      
      console.log(`Disponibilidad para ${date}:`, {
        publicMorningReservations: publicMorningReservations.length,
        publicAfternoonReservations: publicAfternoonReservations.length,
        userMorningReservations: userMorningReservations.length,
        userAfternoonReservations: userAfternoonReservations.length,
        totalMorningReservations: allMorningReservations.length,
        totalAfternoonReservations: allAfternoonReservations.length,
        finalMorning: morningAvailable,
        finalAfternoon: afternoonAvailable
      });
    } catch (error) {
      console.log('Google Sheets no disponible, usando simulación:', error);
      // Fallback a simulación
      const existingReservations = mockReservations.get(date);
      morningAvailable = !existingReservations?.morning;
      afternoonAvailable = !existingReservations?.afternoon;
    }

    const response = {
      success: true,
      morningAvailable,
      afternoonAvailable,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
