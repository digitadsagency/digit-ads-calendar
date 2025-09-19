import { NextRequest, NextResponse } from 'next/server';
import { isDateAvailable } from '@/lib/date';
import { TimeSlot } from '@/lib/config';
import { getReservationsByDate } from '@/lib/sheets';
import { getAllUserReservationsForAvailability } from '@/lib/users';

// Definir horarios disponibles por bloque
const MORNING_TIME_SLOTS: TimeSlot[] = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'];
const AFTERNOON_TIME_SLOTS: TimeSlot[] = ['16:00', '16:30', '17:00', '17:30'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, block } = body;

    // Validar que se proporcione la fecha y bloque
    if (!date || !block) {
      return NextResponse.json(
        { error: 'La fecha y bloque son requeridos' },
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
        availableTimeSlots: []
      });
    }

    // Obtener horarios del bloque seleccionado
    const timeSlots = block === 'Mañana' ? MORNING_TIME_SLOTS : AFTERNOON_TIME_SLOTS;
    
    // Verificar disponibilidad de cada horario
    let availableTimeSlots: TimeSlot[] = [];
    
    try {
      // Verificar reservas públicas
      const publicReservations = await getReservationsByDate(date);
      const publicReservationsForBlock = publicReservations.filter(r => 
        r.bloque === block && r.estado === 'confirmada'
      );
      
      // Verificar reservas de usuarios
      const userReservations = await getAllUserReservationsForAvailability();
      const userReservationsForDate = userReservations.filter(r => 
        r.fecha === date && r.bloque === block && r.estado === 'confirmada'
      );
      
      // Combinar todas las reservas
      const allReservations = [...publicReservationsForBlock, ...userReservationsForDate];
      
      console.log(`🔍 Reservas encontradas para ${date} - ${block}:`, allReservations.map(r => ({
        id: r.id,
        horario: r.horario,
        estado: r.estado
      })));
      
      // Si hay al menos una reserva en el bloque, no hay horarios disponibles
      if (allReservations.length > 0) {
        console.log(`🚫 Bloque ${block} completamente ocupado - ${allReservations.length} reserva(s) encontrada(s)`);
        availableTimeSlots = []; // No hay horarios disponibles
      } else {
        // Si no hay reservas, todos los horarios están disponibles
        availableTimeSlots = [...timeSlots];
        console.log(`✅ Bloque ${block} completamente disponible - todos los horarios libres`);
      }
      
      console.log(`Horarios disponibles para ${date} - ${block}:`, availableTimeSlots);
      
    } catch (error) {
      console.log('Error verificando horarios específicos:', error);
      // En caso de error, devolver todos los horarios como disponibles
      return NextResponse.json({
        success: true,
        availableTimeSlots: timeSlots
      });
    }

    const response = {
      success: true,
      availableTimeSlots,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error verificando horarios específicos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
