'use client';

import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  disabled?: boolean;
}

export default function DatePicker({ selectedDate, onDateChange, disabled = false }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Generar fechas disponibles para el mes actual
  const generateAvailableDates = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const today = startOfDay(new Date());
    
    const available = days
      .filter(day => {
        const dayOfWeek = getDay(day);
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Solo lunes a viernes
        const isNotPast = !isBefore(startOfDay(day), today); // No días pasados
        return isWeekday && isNotPast;
      })
      .map(day => format(day, 'yyyy-MM-dd'));
    
    setAvailableDates(available);
  };

  useEffect(() => {
    generateAvailableDates(currentMonth);
  }, [currentMonth]);

  const handleDateClick = (date: string) => {
    if (!disabled && availableDates.includes(date)) {
      onDateChange(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const isDateSelected = (date: string) => date === selectedDate;
  const isDateAvailable = (date: string) => availableDates.includes(date);

  // Generar la grilla completa del calendario (incluyendo días de meses anteriores/siguientes)
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), // Lunes
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), // Domingo
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          onClick={goToNextMonth}
          disabled={disabled}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const dateString = format(day, 'yyyy-MM-dd');
          const isSelected = isDateSelected(dateString);
          const isAvailable = isDateAvailable(dateString);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayOfWeek = getDay(day);
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          const isPast = isBefore(startOfDay(day), startOfDay(new Date()));

          // Solo deshabilitar si:
          // 1. El componente está deshabilitado
          // 2. No es del mes actual
          // 3. Es un día pasado
          // 4. No es un día hábil (sábado o domingo)
          const shouldDisable = disabled || !isCurrentMonth || isPast || !isWeekday;

          return (
            <button
              key={dateString}
              onClick={() => handleDateClick(dateString)}
              disabled={shouldDisable}
              className={`
                p-2 text-sm rounded-lg transition-colors
                ${!isCurrentMonth 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : isPast
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : !isWeekday
                      ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                      : isSelected 
                        ? 'bg-primary text-white' 
                        : isAvailable
                          ? 'hover:bg-gray-100 text-gray-900' 
                          : 'text-gray-300 cursor-not-allowed'
                }
                ${isToday && !isSelected && isCurrentMonth && !isPast && isWeekday ? 'ring-2 ring-primary ring-opacity-50' : ''}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• Solo se muestran días hábiles (lunes a viernes)</p>
        <p>• Los días pasados están deshabilitados</p>
        <p>• Haz clic en una fecha para seleccionarla</p>
      </div>
    </div>
  );
}
