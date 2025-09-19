import { NextRequest, NextResponse } from 'next/server';
import { isDateAvailable } from '@/lib/date';
import { generateReservationCode } from '@/lib/id';
import { BookingRequest, BookingResponse } from '@/lib/types';
import { insertReservation, isBlockAvailable } from '@/lib/sheets';

// Simulación de reservas para desarrollo (fallback)
const mockReservations = new Map<string, { morning: boolean; afternoon: boolean }>();

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();
    const { date, block, name, brand, direccion_grabacion, correo, notes } = body;

    // Validaciones básicas
    if (!date || !block || !name || !brand || !direccion_grabacion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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

    // Validar bloque
    if (!['Mañana', 'Tarde'].includes(block)) {
      return NextResponse.json(
        { error: 'Bloque inválido. Use "Mañana" o "Tarde"' },
        { status: 400 }
      );
    }

    // Validar dirección de grabación
    if (!direccion_grabacion.trim()) {
      return NextResponse.json(
        { error: 'La dirección de grabación es requerida' },
        { status: 400 }
      );
    }

    // Verificar que la fecha sea un día hábil
    if (!isDateAvailable(date)) {
      return NextResponse.json(
        { error: 'La fecha seleccionada no está disponible (solo lunes a viernes)' },
        { status: 400 }
      );
    }

    // Verificar disponibilidad del bloque
    let isBlockOccupied = false;
    
    try {
      // Intentar usar Google Sheets
      isBlockOccupied = !(await isBlockAvailable(date, block));
    } catch (error) {
      console.log('Google Sheets no disponible, usando simulación:', error);
      // Fallback a simulación
      const existingReservations = mockReservations.get(date);
      isBlockOccupied = block === 'Mañana' 
        ? (existingReservations?.morning || false)
        : (existingReservations?.afternoon || false);
    }
    
    if (isBlockOccupied) {
      return NextResponse.json(
        { error: `El bloque ${block} ya está ocupado para esta fecha` },
        { status: 400 }
      );
    }

    // Crear reserva
    let codigo_reserva = '';
    
    try {
      // Intentar usar Google Sheets
      const { codigo_reserva: code } = await insertReservation({
        date,
        block,
        timeSlot: '10:00', // API pública usa horario por defecto
        name,
        brand,
        direccion_grabacion,
        correo: correo || '',
        notes: notes || '',
      });
      codigo_reserva = code;
      
      console.log('Reserva guardada en Google Sheets:', {
        date,
        block,
        name,
        brand,
        direccion_grabacion,
        codigo_reserva,
      });
    } catch (error) {
      console.log('Google Sheets no disponible, usando simulación:', error);
      // Fallback a simulación
      codigo_reserva = generateReservationCode();
      
      // Marcar bloque como ocupado en la simulación
      const mockReservationsData = mockReservations.get(date) || { morning: false, afternoon: false };
      if (block === 'Mañana') {
        mockReservationsData.morning = true;
      } else {
        mockReservationsData.afternoon = true;
      }
      mockReservations.set(date, mockReservationsData);
      
      console.log('Reserva simulada:', {
        date,
        block,
        name,
        brand,
        direccion_grabacion,
        correo,
        notes,
        codigo_reserva,
      });
    }

    const response: BookingResponse = {
      success: true,
      code: codigo_reserva,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error procesando reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
