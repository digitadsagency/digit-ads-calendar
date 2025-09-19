export const BOOKING_CONFIG = {
  timezone: "America/Mexico_City",
  // Horarios por bloque (strings HH:mm 24h)
  morning: { start: "10:00", end: "13:00" },
  afternoon: { start: "16:00", end: "17:30" },
  // Nombres de bloques que se guardan en Sheets
  blocks: ["Mañana", "Tarde"] as const,
  // Habilitar solo lunes a viernes
  enabledWeekdays: [1, 2, 3, 4, 5], // 1 = Monday ... 5 = Friday
} as const;

export type BlockType = typeof BOOKING_CONFIG.blocks[number];

// Tipos para horarios específicos
export type TimeSlot = '10:00' | '10:30' | '11:00' | '11:30' | '12:00' | '12:30' | '13:00' | '16:00' | '16:30' | '17:00' | '17:30';

export interface BookingConfigFromSheets {
  morning_start?: string;
  morning_end?: string;
  afternoon_start?: string;
  afternoon_end?: string;
  enabled_weekdays?: string; // "1,2,3,4,5"
}

export function mergeConfigFromSheets(sheetsConfig: BookingConfigFromSheets) {
  const config = { ...BOOKING_CONFIG };
  
  if (sheetsConfig.morning_start && sheetsConfig.morning_end) {
    config.morning = {
      start: sheetsConfig.morning_start as any,
      end: sheetsConfig.morning_end as any,
    };
  }
  
  if (sheetsConfig.afternoon_start && sheetsConfig.afternoon_end) {
    config.afternoon = {
      start: sheetsConfig.afternoon_start as any,
      end: sheetsConfig.afternoon_end as any,
    };
  }
  
  if (sheetsConfig.enabled_weekdays) {
    config.enabledWeekdays = sheetsConfig.enabled_weekdays
      .split(',')
      .map(day => parseInt(day.trim()))
      .filter(day => day >= 1 && day <= 7) as any;
  }
  
  return config;
}
