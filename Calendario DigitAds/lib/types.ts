import { BlockType, TimeSlot } from './config';

// Re-exportar tipos para uso en componentes
export type { BlockType, TimeSlot };

export interface Reservation {
  id: string;
  fecha: string; // YYYY-MM-DD
  bloque: BlockType;
  horario: TimeSlot; // Nuevo campo para horario específico
  cliente_nombre: string;
  empresa_marca: string;
  direccion_grabacion: string;
  correo: string;
  notas: string;
  estado: 'confirmada' | 'cancelada';
  codigo_reserva: string;
  gcal_event_id_ph1: string;
  gcal_event_id_ph2: string;
  creado_en: string;
  actualizado_en: string;
}

export interface BookingRequest {
  date: string;
  block: BlockType;
  timeSlot: TimeSlot; // Nuevo campo para horario específico
  name: string;
  brand: string;
  direccion_grabacion: string;
  correo: string;
  notes: string;
  userId?: string; // Opcional para reservas de usuarios autenticados
}

export interface ClientUser {
  id: string;
  email: string;
  password: string; // Hash de la contraseña
  name: string;
  company: string;
  monthlyLimit: number; // Límite de reservas por mes
  whatsapp?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserReservation {
  id: string;
  userId: string;
  fecha: string;
  bloque: BlockType;
  horario: TimeSlot; // Nuevo campo para horario específico
  cliente_nombre: string;
  empresa_marca: string;
  direccion_grabacion: string;
  correo: string;
  notas: string;
  estado: 'confirmada' | 'cancelada';
  codigo_reserva: string;
  creado_en: string;
  actualizado_en: string;
}

export interface AvailabilityResponse {
  morningAvailable: boolean;
  afternoonAvailable: boolean;
}

export interface BookingResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
}

export interface DualCalendarEvents {
  id1: string;
  id2: string;
}
