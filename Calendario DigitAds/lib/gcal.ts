import { google } from 'googleapis';
import { CalendarEvent, DualCalendarEvents } from './types';
// import { toISO } from './date'; // Comentado para evitar conflicto
import { BOOKING_CONFIG } from './config';

// Configuración de autenticación
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return auth;
}

// Obtener instancia de Calendar API
async function getCalendar() {
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  return calendar;
}

// Convertir fecha y hora a ISO con timezone
export function toISO(date: string, time: string, tz: string = BOOKING_CONFIG.timezone): string {
  const dateTimeString = `${date}T${time}`;
  const zonedDate = new Date(dateTimeString);
  return zonedDate.toISOString();
}

// Crear evento en un calendario específico
async function createEventInCalendar(
  calendarId: string, 
  event: CalendarEvent
): Promise<string> {
  const calendar = await getCalendar();
  
  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    
    return response.data.id || '';
  } catch (error) {
    console.error(`Error creando evento en calendario ${calendarId}:`, error);
    throw error;
  }
}

// Eliminar evento de un calendario específico
async function deleteEventFromCalendar(calendarId: string, eventId: string): Promise<void> {
  const calendar = await getCalendar();
  
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error(`Error eliminando evento ${eventId} del calendario ${calendarId}:`, error);
    throw error;
  }
}

// Crear eventos en ambos calendarios
export async function createDualEvents({
  summary,
  description,
  startISO,
  endISO,
  location,
}: {
  summary: string;
  description: string;
  startISO: string;
  endISO: string;
  location?: string;
}): Promise<DualCalendarEvents> {
  const photographer1CalendarId = process.env.PHOTOGRAPHER1_CALENDAR_ID;
  const photographer2CalendarId = process.env.PHOTOGRAPHER2_CALENDAR_ID;

  if (!photographer1CalendarId || !photographer2CalendarId) {
    throw new Error('IDs de calendario de fotógrafos no configurados');
  }

  const event: CalendarEvent = {
    summary,
    description,
    start: {
      dateTime: startISO,
      timeZone: BOOKING_CONFIG.timezone,
    },
    end: {
      dateTime: endISO,
      timeZone: BOOKING_CONFIG.timezone,
    },
    location,
  };

  try {
    // Crear eventos en paralelo
    const [id1, id2] = await Promise.all([
      createEventInCalendar(photographer1CalendarId, event),
      createEventInCalendar(photographer2CalendarId, event),
    ]);

    return { id1, id2 };
  } catch (error) {
    console.error('Error creando eventos duales:', error);
    throw error;
  }
}

// Eliminar eventos de ambos calendarios
export async function deleteDualEvents({ id1, id2 }: DualCalendarEvents): Promise<void> {
  const photographer1CalendarId = process.env.PHOTOGRAPHER1_CALENDAR_ID;
  const photographer2CalendarId = process.env.PHOTOGRAPHER2_CALENDAR_ID;

  if (!photographer1CalendarId || !photographer2CalendarId) {
    throw new Error('IDs de calendario de fotógrafos no configurados');
  }

  try {
    // Eliminar eventos en paralelo (ignorar errores si el evento ya no existe)
    await Promise.allSettled([
      deleteEventFromCalendar(photographer1CalendarId, id1),
      deleteEventFromCalendar(photographer2CalendarId, id2),
    ]);
  } catch (error) {
    console.error('Error eliminando eventos duales:', error);
    throw error;
  }
}

// Verificar disponibilidad en ambos calendarios
export async function checkAvailability(startISO: string, endISO: string): Promise<boolean> {
  const photographer1CalendarId = process.env.PHOTOGRAPHER1_CALENDAR_ID;
  const photographer2CalendarId = process.env.PHOTOGRAPHER2_CALENDAR_ID;

  if (!photographer1CalendarId || !photographer2CalendarId) {
    throw new Error('IDs de calendario de fotógrafos no configurados');
  }

  const calendar = await getCalendar();

  try {
    // Verificar disponibilidad en ambos calendarios
    const [freeBusy1, freeBusy2] = await Promise.all([
      calendar.freebusy.query({
        requestBody: {
          timeMin: startISO,
          timeMax: endISO,
          items: [{ id: photographer1CalendarId }],
        },
      }),
      calendar.freebusy.query({
        requestBody: {
          timeMin: startISO,
          timeMax: endISO,
          items: [{ id: photographer2CalendarId }],
        },
      }),
    ]);

    // Verificar si hay conflictos en alguno de los calendarios
    const busy1 = freeBusy1.data.calendars?.[photographer1CalendarId]?.busy || [];
    const busy2 = freeBusy2.data.calendars?.[photographer2CalendarId]?.busy || [];

    return busy1.length === 0 && busy2.length === 0;
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    // En caso de error, asumir que está disponible
    return true;
  }
}

// Crear evento de grabación con formato específico
export async function createRecordingEvent({
  date,
  block,
  clientName,
  brand,
  whatsapp,
  notes,
  morningStart,
  morningEnd,
  afternoonStart,
  afternoonEnd,
}: {
  date: string;
  block: 'Mañana' | 'Tarde';
  clientName: string;
  brand: string;
  whatsapp: string;
  notes: string;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}): Promise<DualCalendarEvents> {
  const isMorning = block === 'Mañana';
  const startTime = isMorning ? morningStart : afternoonStart;
  const endTime = isMorning ? morningEnd : afternoonEnd;

  const startISO = toISO(date, startTime);
  const endISO = toISO(date, endTime);

  const summary = `Grabación Digit Ads – ${clientName} (${block})`;
  
  const description = [
    `Cliente: ${clientName}`,
    `Marca/Empresa: ${brand}`,
    `WhatsApp: ${whatsapp}`,
    notes ? `Notas: ${notes}` : '',
    `Código de reserva: [Se generará después]`,
  ].filter(Boolean).join('\n');

  return createDualEvents({
    summary,
    description,
    startISO,
    endISO,
  });
}
