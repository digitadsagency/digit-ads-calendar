import { format, parseISO, isValid, isWeekend, getDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { BOOKING_CONFIG } from './config';

export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

export function isValidDate(dateString: string): boolean {
  const date = parseDate(dateString);
  return isValid(date);
}

export function isWeekday(date: Date): boolean {
  const dayOfWeek = getDay(date);
  // Convertir de 0-6 (domingo=0) a 1-7 (lunes=1)
  const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  return BOOKING_CONFIG.enabledWeekdays.includes(normalizedDay as any);
}

export function isDateAvailable(dateString: string): boolean {
  if (!isValidDate(dateString)) return false;
  
  const date = parseDate(dateString);
  return isWeekday(date);
}

export function toISO(date: string, time: string, timezone: string = BOOKING_CONFIG.timezone): string {
  const dateTimeString = `${date}T${time}`;
  const zonedDate = zonedTimeToUtc(dateTimeString, timezone);
  return zonedDate.toISOString();
}

export function fromISO(isoString: string, timezone: string = BOOKING_CONFIG.timezone): { date: string; time: string } {
  const utcDate = new Date(isoString);
  const zonedDate = utcToZonedTime(utcDate, timezone);
  
  return {
    date: formatDate(zonedDate, 'yyyy-MM-dd'),
    time: formatDate(zonedDate, 'HH:mm'),
  };
}

export function getCurrentDateInTimezone(timezone: string = BOOKING_CONFIG.timezone): string {
  const now = new Date();
  const zonedDate = utcToZonedTime(now, timezone);
  return formatDate(zonedDate, 'yyyy-MM-dd');
}

export function addDays(dateString: string, days: number): string {
  const date = parseDate(dateString);
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return formatDate(newDate, 'yyyy-MM-dd');
}

export function formatDateForDisplay(dateString: string): string {
  // Crear fecha en zona horaria local para evitar problemas de UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return format(localDate, 'dd/MM/yyyy');
}

export function formatTimeForDisplay(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
