import { google } from 'googleapis';
import { ClientUser, UserReservation } from './types';
import { generateReservationCode } from './id';

const SHEETS_API_VERSION = 'v4';
const USERS_SHEET_NAME = 'usuarios';
const USER_RESERVATIONS_SHEET_NAME = 'reservas_usuarios';

// Headers para la pestaña de usuarios
const USERS_HEADERS = [
  'id', 'email', 'password', 'name', 'company', 'monthlyLimit', 
  'whatsapp', 'created_at', 'last_login', 'is_active'
];

// Headers para la pestaña de reservas de usuarios
const USER_RESERVATIONS_HEADERS = [
  'id', 'userId', 'fecha', 'bloque', 'horario', 'cliente_nombre', 'empresa_marca', 
  'direccion_grabacion', 'correo', 'notas', 'estado', 'codigo_reserva', 
  'creado_en', 'actualizado_en'
];

// Configuración de Google Sheets
const getSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: SHEETS_API_VERSION, auth });
};

// Asegurar que las pestañas de usuarios estén configuradas
export async function ensureUsersSheetsSetup(): Promise<void> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log('Google Sheets no configurado, usando simulación');
    return;
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Verificar si las pestañas existen
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheets = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];

    // Crear pestaña de usuarios si no existe
    if (!existingSheets.includes(USERS_SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: USERS_SHEET_NAME,
              },
            },
          }],
        },
      });

      // Agregar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${USERS_SHEET_NAME}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [USERS_HEADERS],
        },
      });
    }

    // Crear pestaña de reservas de usuarios si no existe
    if (!existingSheets.includes(USER_RESERVATIONS_SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: USER_RESERVATIONS_SHEET_NAME,
              },
            },
          }],
        },
      });

      // Agregar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${USER_RESERVATIONS_SHEET_NAME}!A1:M1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [USER_RESERVATIONS_HEADERS],
        },
      });
    }

    console.log('Pestañas de usuarios configuradas correctamente');
  } catch (error) {
    console.error('Error configurando pestañas de usuarios:', error);
    throw error;
  }
}

// Crear un nuevo usuario
export async function createUser(userData: Omit<ClientUser, 'id' | 'created_at' | 'is_active'>): Promise<ClientUser> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error('Google Sheets no configurado');
  }

  try {
    await ensureUsersSheetsSetup();
    
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    const id = generateReservationCode().replace('DIG-', 'USR-');
    const now = new Date().toISOString();
    
    const newUser: ClientUser = {
      id,
      ...userData,
      created_at: now,
      is_active: true,
    };

    const newRow = [
      newUser.id,
      newUser.email,
      newUser.password,
      newUser.name,
      newUser.company,
      newUser.monthlyLimit,
      newUser.whatsapp || '',
      newUser.created_at,
      newUser.last_login || '',
      newUser.is_active,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [newRow],
      },
    });

    console.log('Usuario creado:', { id: newUser.id, email: newUser.email, name: newUser.name });
    return newUser;
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
}

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<ClientUser | null> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return null;
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    
    for (const row of rows.slice(1)) { // Saltar header
      if (row.length >= 10 && row[1] === email) {
        return {
          id: row[0],
          email: row[1],
          password: row[2],
          name: row[3],
          company: row[4],
          monthlyLimit: parseInt(row[5]) || 1,
          whatsapp: row[6] || '',
          created_at: row[7],
          last_login: row[8] || '',
          is_active: row[9] === 'true' || row[9] === 'TRUE',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

// Obtener todas las reservas de un usuario en un mes específico
export async function getUserReservationsInMonth(userId: string, year: number, month: number): Promise<UserReservation[]> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservations: UserReservation[] = [];
    
    const monthStr = month.toString().padStart(2, '0');
    const yearMonthPattern = `${year}-${monthStr}`;

    rows.forEach((row) => {
      if (row.length >= 13) {
        const estado = row[9];
        const codigoReserva = row[10];
        const fecha = row[2];
        
        // Para reservas canceladas, los datos pueden estar vacíos
        let rowUserId = row[1];
        if (!rowUserId && estado === 'cancelada') {
          // Buscar el userId en otras filas con el mismo código de reserva
          const matchingRow = rows.find(r => r.length >= 13 && r[10] === codigoReserva && r[1]);
          if (matchingRow) {
            rowUserId = matchingRow[1];
          }
        }
        
        // Solo procesar si coincide con el usuario y tiene los datos necesarios
        if (rowUserId === userId && estado && codigoReserva) {
          // Para reservas canceladas, verificar si la fecha está en el mes correcto
          let fechaValida = fecha && fecha.startsWith(yearMonthPattern);
          
          // Si no hay fecha pero es cancelada, intentar encontrar la fecha original
          if (!fechaValida && estado === 'cancelada') {
            const matchingRow = rows.find(r => r.length >= 13 && r[10] === codigoReserva && r[2] && r[2].startsWith(yearMonthPattern));
            if (matchingRow) {
              fechaValida = true;
            }
          }
          
          if (fechaValida) {
            reservations.push({
              id: row[0] || codigoReserva,
              userId: rowUserId,
              fecha: row[2] || '',
              bloque: row[3] as 'Mañana' | 'Tarde' || 'Mañana',
              horario: '10:00', // Reservas antiguas usan horario por defecto
              cliente_nombre: row[4] || 'Reserva cancelada',
              empresa_marca: row[5] || '',
              direccion_grabacion: row[6] || '',
              correo: row[7] || '',
              notas: row[8] || '',
              estado: estado as 'confirmada' | 'cancelada',
              codigo_reserva: codigoReserva,
              creado_en: row[11] || '',
              actualizado_en: row[12] || '',
            });
          }
        }
      }
    });

    return reservations.filter(r => r.estado === 'confirmada');
  } catch (error) {
    console.error('Error obteniendo reservas del usuario:', error);
    return [];
  }
}

// Verificar si un usuario puede hacer una reserva (límite mensual)
export async function canUserMakeReservation(userId: string, date: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    if (!user || !user.is_active) {
      return false;
    }

    const [year, month] = date.split('-').map(Number);
    const currentReservations = await getUserReservationsInMonth(userId, year, month);
    
    // Solo contar reservas confirmadas (no canceladas)
    const confirmedReservations = currentReservations.filter(r => r.estado === 'confirmada');
    
    console.log(`Verificando límite para usuario ${userId}:`, {
      totalReservations: currentReservations.length,
      confirmedReservations: confirmedReservations.length,
      monthlyLimit: user.monthlyLimit,
      canReserve: confirmedReservations.length < user.monthlyLimit
    });
    
    return confirmedReservations.length < user.monthlyLimit;
  } catch (error) {
    console.error('Error verificando límite de reservas:', error);
    return false;
  }
}

// Obtener usuario por ID
export async function getUserById(userId: string): Promise<ClientUser | null> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return null;
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    
    for (const row of rows.slice(1)) { // Saltar header
      if (row.length >= 10 && row[0] === userId) {
        return {
          id: row[0],
          email: row[1],
          password: row[2],
          name: row[3],
          company: row[4],
          monthlyLimit: parseInt(row[5]) || 1,
          whatsapp: row[6] || '',
          created_at: row[7],
          last_login: row[8] || '',
          is_active: row[9] === 'true' || row[9] === 'TRUE',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo usuario por ID:', error);
    return null;
  }
}

// Crear reserva para usuario
export async function createUserReservation(userId: string, bookingData: {
  date: string;
  block: 'Mañana' | 'Tarde';
  timeSlot: string;
  name: string;
  brand: string;
  direccion_grabacion: string;
  correo: string;
  notes: string;
}): Promise<{ id: string; codigo_reserva: string }> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error('Google Sheets no configurado');
  }

  try {
    await ensureUsersSheetsSetup();
    
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    const id = generateReservationCode();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      userId,
      bookingData.date,
      bookingData.block,
      bookingData.timeSlot, // Nuevo campo para horario específico
      bookingData.name,
      bookingData.brand,
      bookingData.direccion_grabacion,
      bookingData.correo,
      bookingData.notes,
      'confirmada',
      id,
      now,
      now,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [newRow],
      },
    });

    console.log('Reserva de usuario creada:', { id, userId, date: bookingData.date, block: bookingData.block });
    return { id, codigo_reserva: id };
  } catch (error) {
    console.error('Error creando reserva de usuario:', error);
    throw error;
  }
}

// Obtener TODAS las reservas de usuarios (para verificación de disponibilidad)
export async function getAllUserReservationsForAvailability(): Promise<UserReservation[]> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservations: UserReservation[] = [];

    rows.forEach((row) => {
      // Compatibilidad con reservas antiguas (13 columnas) y nuevas (14 columnas)
      if (row.length >= 13 && row[1] && row[1] !== 'userId') { // Sin filtrar por userId específico
        const id = row[0];
        const estado = row.length >= 14 ? row[10] : row[9];
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        if (id && estado && codigoReserva) {
          reservations.push({
            id: id,
            userId: row[1],
            fecha: row[2] || '',
            bloque: row[3] as 'Mañana' | 'Tarde' || 'Mañana',
            // Para reservas antiguas (13 columnas), no hay horario, para nuevas (14 columnas) está en row[4]
            horario: row.length >= 14 ? (row[4] || '') : '',
            // Para reservas antiguas (13 columnas), los campos están en posiciones diferentes
            cliente_nombre: row.length >= 14 ? (row[5] || '') : (row[4] || ''),
            empresa_marca: row.length >= 14 ? (row[6] || '') : (row[5] || ''),
            direccion_grabacion: row.length >= 14 ? (row[7] || '') : (row[6] || ''),
            correo: row.length >= 14 ? (row[8] || '') : (row[7] || ''),
            notas: row.length >= 14 ? (row[9] || '') : (row[8] || ''),
            estado: estado as 'confirmada' | 'cancelada',
            codigo_reserva: codigoReserva,
            // Para reservas antiguas (13 columnas), las fechas están en row[11] y row[12]
            creado_en: row.length >= 14 ? (row[12] || '') : (row[11] || ''),
            actualizado_en: row.length >= 14 ? (row[13] || '') : (row[12] || ''),
          });
        }
      }
    });

    return reservations;
  } catch (error) {
    console.error('Error obteniendo todas las reservas de usuarios:', error);
    return [];
  }
}

// Obtener todas las reservas de un usuario (solo confirmadas)
export async function getAllUserReservations(userId: string): Promise<UserReservation[]> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservations: UserReservation[] = [];

    rows.forEach((row) => {
      if (row.length >= 13 && row[1] === userId && row[9] === 'confirmada') {
        reservations.push({
          id: row[0],
          userId: row[1],
          fecha: row[2],
          bloque: row[3] as 'Mañana' | 'Tarde',
          horario: '10:00', // Reservas antiguas usan horario por defecto
          cliente_nombre: row[4],
          empresa_marca: row[5],
          direccion_grabacion: row[6],
          correo: row[7],
          notas: row[8],
          estado: row[9] as 'confirmada' | 'cancelada',
          codigo_reserva: row[10],
          creado_en: row[11],
          actualizado_en: row[12],
        });
      }
    });

    return reservations.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error obteniendo reservas del usuario:', error);
    return [];
  }
}

// Obtener TODAS las reservas de un usuario (incluyendo canceladas) para mostrar en historial
export async function getAllUserReservationsWithCancelled(userId: string): Promise<UserReservation[]> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USER_RESERVATIONS_SHEET_NAME}!A:N`,
    });

    const rows = response.data.values || [];
    const reservations: UserReservation[] = [];

    console.log(`🔍 getAllUserReservationsWithCancelled - Usuario: ${userId}`);
    console.log(`🔍 Total de filas en Google Sheets: ${rows.length}`);

    rows.forEach((row, index) => {
      console.log(`🔍 Fila ${index + 1}:`, {
        length: row.length,
        userId: row[1],
        matchesUser: row[1] === userId,
        id: row[0],
        estado: row.length >= 14 ? row[10] : row[9],
        codigoReserva: row.length >= 14 ? row[11] : row[10],
        fecha: row[2]
      });

      // Compatibilidad con reservas antiguas (13 columnas) y nuevas (14 columnas)
      if ((row.length >= 13 || row.length >= 14) && row[1] === userId) {
        // Solo procesar filas que tengan todos los datos necesarios
        const id = row[0];
        // Para reservas antiguas (13 columnas), el estado está en row[9], para nuevas (14 columnas) en row[10]
        const estado = row.length >= 14 ? row[10] : row[9];
        // Para reservas antiguas (13 columnas), el código está en row[10], para nuevas (14 columnas) en row[11]
        const codigoReserva = row.length >= 14 ? row[11] : row[10];
        
        // Solo incluir si tiene todos los datos básicos
        if (id && estado && codigoReserva) {
          const reservation = {
            id: id,
            userId: row[1],
            fecha: row[2] || '',
            bloque: row[3] as 'Mañana' | 'Tarde' || 'Mañana',
            // Para reservas antiguas (13 columnas), no hay horario, para nuevas (14 columnas) está en row[4]
            horario: row.length >= 14 ? (row[4] || '') : '',
            // Para reservas antiguas (13 columnas), los campos están en posiciones diferentes
            cliente_nombre: row.length >= 14 ? (row[5] || '') : (row[4] || ''),
            empresa_marca: row.length >= 14 ? (row[6] || '') : (row[5] || ''),
            direccion_grabacion: row.length >= 14 ? (row[7] || '') : (row[6] || ''),
            correo: row.length >= 14 ? (row[8] || '') : (row[7] || ''),
            notas: row.length >= 14 ? (row[9] || '') : (row[8] || ''),
            estado: estado as 'confirmada' | 'cancelada',
            codigo_reserva: codigoReserva,
            // Para reservas antiguas (13 columnas), las fechas están en row[11] y row[12]
            creado_en: row.length >= 14 ? (row[12] || '') : (row[11] || ''),
            actualizado_en: row.length >= 14 ? (row[13] || '') : (row[12] || ''),
          };
          
          console.log(`✅ Reserva procesada:`, {
            id: reservation.id,
            estado: reservation.estado,
            fecha: reservation.fecha,
            codigo: reservation.codigo_reserva
          });
          
          reservations.push(reservation);
        } else {
          console.log(`❌ Fila omitida - datos incompletos:`, {
            id: !!id,
            estado: !!estado,
            codigoReserva: !!codigoReserva
          });
        }
      }
    });

    console.log(`📊 Reservas finales para usuario ${userId}:`, reservations.map(r => ({
      id: r.id,
      estado: r.estado,
      fecha: r.fecha,
      codigo: r.codigo_reserva
    })));

    return reservations.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (error) {
    console.error('Error obteniendo todas las reservas del usuario:', error);
    return [];
  }
}

// Obtener todos los usuarios (para admin)
export async function getAllUsers(): Promise<ClientUser[]> {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values || [];
    const users: ClientUser[] = [];

    rows.forEach((row, index) => {
      // Saltar el header (primera fila) y solo procesar filas que tengan datos válidos
      if (index > 0 && row.length >= 10 && row[0] && row[0] !== 'id' && row[1] && row[1] !== 'email') {
        users.push({
          id: row[0],
          email: row[1],
          password: row[2],
          name: row[3],
          company: row[4],
          monthlyLimit: parseInt(row[5]) || 1,
          whatsapp: row[6] || '',
          created_at: row[7],
          last_login: row[8] || '',
          is_active: row[9] === 'true' || row[9] === 'TRUE',
        });
      }
    });

    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}
