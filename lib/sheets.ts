import { google } from 'googleapis';
import { Reservation, BookingRequest } from './types';
import { BookingConfigFromSheets } from './config';
import { generateReservationCode, generateId } from './id';
import { getCurrentDateInTimezone } from './date';

// Configuración de autenticación
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// Obtener instancia de Sheets API
async function getSheets() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Headers de las pestañas
const RESERVAS_HEADERS = [
  'id', 'fecha', 'bloque', 'horario', 'cliente_nombre', 'empresa_marca', 'direccion_grabacion', 
  'correo', 'notas', 'estado', 'codigo_reserva', 'gcal_event_id_ph1', 
  'gcal_event_id_ph2', 'creado_en', 'actualizado_en'
];

const CONFIG_HEADERS = [
  'key', 'value'
];

// Asegurar que las pestañas y headers existan
export async function ensureSheetsSetup(): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
  }

  try {
    // Obtener información del spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheets = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];
    
    // Crear pestaña de reservas si no existe
    if (!existingSheets.includes('reservas')) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'reservas',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: RESERVAS_HEADERS.length,
                },
              },
            },
          }],
        },
      });

      // Agregar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'reservas!A1:N1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [RESERVAS_HEADERS],
        },
      });
    }

    // Crear pestaña de config si no existe
    if (!existingSheets.includes('config')) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'config',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 2,
                },
              },
            },
          }],
        },
      });

      // Agregar headers y valores por defecto
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'config!A1:B1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [CONFIG_HEADERS],
        },
      });

      // Agregar configuración por defecto
      const defaultConfig = [
        ['morning_start', '10:00'],
        ['morning_end', '13:00'],
        ['afternoon_start', '16:00'],
        ['afternoon_end', '19:00'],
        ['enabled_weekdays', '1,2,3,4,5'],
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'config!A2:B6',
        valueInputOption: 'RAW',
        requestBody: {
          values: defaultConfig,
        },
      });
    }
  } catch (error) {
    console.error('Error configurando sheets:', error);
    throw error;
  }
}

// Obtener configuración desde Sheets
export async function getConfigFromSheets(): Promise<BookingConfigFromSheets> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'config!A2:B100',
    });

    const rows = response.data.values || [];
    const config: BookingConfigFromSheets = {};

    rows.forEach(([key, value]) => {
      if (key && value) {
        switch (key) {
          case 'morning_start':
            config.morning_start = value;
            break;
          case 'morning_end':
            config.morning_end = value;
            break;
          case 'afternoon_start':
            config.afternoon_start = value;
            break;
          case 'afternoon_end':
            config.afternoon_end = value;
            break;
          case 'enabled_weekdays':
            config.enabled_weekdays = value;
            break;
        }
      }
    });

    return config;
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return {};
  }
}

// Obtener reservas por fecha
export async function getReservationsByDate(date: string): Promise<Reservation[]> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'reservas!A2:N1000',
    });

    const rows = response.data.values || [];
    const reservations: Reservation[] = [];

    rows.forEach((row) => {
      if (row.length >= 15 && row[1] === date) { // row[1] es la fecha, ahora necesitamos 15 columnas
        reservations.push({
          id: row[0],
          fecha: row[1],
          bloque: row[2] as 'Mañana' | 'Tarde',
          horario: row[3] || '', // Nuevo campo para horario específico
          cliente_nombre: row[4],
          empresa_marca: row[5],
          direccion_grabacion: row[6],
          correo: row[7], // Cambiado de whatsapp a correo
          notas: row[8],
          estado: row[9] as 'confirmada' | 'cancelada',
          codigo_reserva: row[10],
          gcal_event_id_ph1: row[11] || '',
          gcal_event_id_ph2: row[12] || '',
          creado_en: row[13],
          actualizado_en: row[14],
        });
      }
    });

    return reservations;
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return [];
  }
}

// Verificar si un bloque está disponible
export async function isBlockAvailable(date: string, block: 'Mañana' | 'Tarde'): Promise<boolean> {
  const reservations = await getReservationsByDate(date);
  return !reservations.some(r => r.bloque === block && r.estado === 'confirmada');
}

// Insertar nueva reserva
export async function insertReservation(booking: BookingRequest): Promise<{ id: string; codigo_reserva: string }> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  const id = generateId();
  const codigo_reserva = generateReservationCode();
  const now = getCurrentDateInTimezone();

  const newRow = [
    id,
    booking.date,
    booking.block,
    booking.timeSlot || '', // Nuevo campo para horario específico
    booking.name,
    booking.brand,
    booking.direccion_grabacion,
    booking.correo, // Cambiado de whatsapp a correo
    booking.notes,
    'confirmada',
    codigo_reserva,
    '', // gcal_event_id_ph1 - se llenará después
    '', // gcal_event_id_ph2 - se llenará después
    now,
    now,
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'reservas!A:N',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newRow],
      },
    });

    return { id, codigo_reserva };
  } catch (error) {
    console.error('Error insertando reserva:', error);
    throw error;
  }
}

// Función simplificada sin Google Calendar
export async function updateReservationStatus(
  reservationId: string, 
  status: 'confirmada' | 'cancelada'
): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  try {
    // Obtener todas las filas para encontrar la correcta
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'reservas!A2:N1000',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === reservationId) {
        rowIndex = i + 2; // +2 porque empezamos desde la fila 2 y los índices son 1-based
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Reserva no encontrada');
    }

    const now = getCurrentDateInTimezone();

    // Actualizar estado y fecha de actualización
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `reservas!I${rowIndex}:M${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[status, '', '', '', now]],
      },
    });
  } catch (error) {
    console.error('Error actualizando estado de reserva:', error);
    throw error;
  }
}

// Cancelar reserva (simplificado sin Google Calendar)
export async function cancelReservation(reservationId: string): Promise<void> {
  await updateReservationStatus(reservationId, 'cancelada');
}

// Obtener todas las reservas (para admin) - incluye reservas públicas y de usuarios
export async function getAllReservations(): Promise<Reservation[]> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

  try {
    const allReservations: Reservation[] = [];

    // Obtener reservas públicas
    try {
      const publicResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'reservas!A2:N1000',
      });

      const publicRows = publicResponse.data.values || [];
      publicRows.forEach((row) => {
        // Solo procesar filas que tengan todos los datos esenciales
        if (row.length >= 15 && 
            row[0] && // id
            row[1] && // fecha
            row[2] && // bloque
            row[4] && // cliente_nombre (ahora en posición 4)
            row[9] && // estado
            row[10]) { // codigo_reserva
          allReservations.push({
            id: row[0],
            fecha: row[1],
            bloque: row[2] as 'Mañana' | 'Tarde',
            horario: row[3] || '', // Nuevo campo para horario específico
            cliente_nombre: row[4],
            empresa_marca: row[5] || '',
            direccion_grabacion: row[6] || '',
            correo: row[7] || '', // Cambiado de whatsapp a correo
            notas: row[8] || '',
            estado: row[9] as 'confirmada' | 'cancelada',
            codigo_reserva: row[10],
            gcal_event_id_ph1: row[11] || '',
            gcal_event_id_ph2: row[12] || '',
            creado_en: row[13] || '',
            actualizado_en: row[14] || '',
          });
        }
      });
    } catch (error) {
      console.log('No se pudieron obtener reservas públicas:', error);
    }

    // Obtener reservas de usuarios
    try {
      const userResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'reservas_usuarios!A2:M1000',
      });

      const userRows = userResponse.data.values || [];
      userRows.forEach((row) => {
        // Solo procesar filas que tengan todos los datos esenciales
        if (row.length >= 14 && 
            row[0] && // id
            row[1] && // userId
            row[2] && // fecha
            row[3] && // bloque
            row[5] && // cliente_nombre (ahora en posición 5)
            row[10] && // estado
            row[11]) { // codigo_reserva
          allReservations.push({
            id: row[0],
            fecha: row[2],
            bloque: row[3] as 'Mañana' | 'Tarde',
            horario: row[4] || '', // Nuevo campo para horario específico
            cliente_nombre: row[5],
            empresa_marca: row[6] || '',
            direccion_grabacion: row[7] || '',
            correo: row[8] || '',
            notas: row[9] || '',
            estado: row[10] as 'confirmada' | 'cancelada',
            codigo_reserva: row[11],
            gcal_event_id_ph1: '', // No aplica para reservas de usuarios
            gcal_event_id_ph2: '', // No aplica para reservas de usuarios
            creado_en: row[12] || '',
            actualizado_en: row[13] || '',
          });
        }
      });
    } catch (error) {
      console.log('No se pudieron obtener reservas de usuarios:', error);
    }

    console.log(`📊 Total de reservas obtenidas: ${allReservations.length} (públicas + usuarios)`);
    console.log('📊 Reservas válidas:', allReservations.map(r => ({ 
      id: r.id, 
      fecha: r.fecha, 
      estado: r.estado,
      cliente: r.cliente_nombre 
    })));
    
    return allReservations.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error obteniendo todas las reservas:', error);
    return [];
  }
}
