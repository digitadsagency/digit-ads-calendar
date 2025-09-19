'use client';

import React from 'react';
import { BlockType, TimeSlot } from '@/lib/types';

interface TimeSlotSelectorProps {
  selectedBlock: BlockType | null;
  selectedTimeSlot: TimeSlot | null;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  availableTimeSlots: TimeSlot[];
  loading?: boolean;
}

// Definir horarios disponibles por bloque
const MORNING_TIME_SLOTS: TimeSlot[] = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'];
const AFTERNOON_TIME_SLOTS: TimeSlot[] = ['16:00', '16:30', '17:00', '17:30'];

export default function TimeSlotSelector({
  selectedBlock,
  selectedTimeSlot,
  onTimeSlotSelect,
  availableTimeSlots,
  loading = false
}: TimeSlotSelectorProps) {
  if (!selectedBlock) {
    return null;
  }

  const timeSlots = selectedBlock === 'Mañana' ? MORNING_TIME_SLOTS : AFTERNOON_TIME_SLOTS;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Selecciona el horario específico
      </h3>
      <p className="text-sm text-gray-600">
        Elige la hora exacta para tu sesión de grabación en el bloque de {selectedBlock.toLowerCase()}.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {timeSlots.map((timeSlot) => {
          const isAvailable = availableTimeSlots.includes(timeSlot);
          const isSelected = selectedTimeSlot === timeSlot;
          
          return (
            <button
              key={timeSlot}
              type="button"
              onClick={() => onTimeSlotSelect(timeSlot)}
              disabled={!isAvailable || loading}
              className={`
                px-4 py-3 rounded-lg border-2 text-center font-medium transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary text-white shadow-lg'
                  : isAvailable
                    ? 'border-gray-300 bg-white text-gray-700 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="text-lg font-semibold">{timeSlot}</div>
              <div className="text-xs opacity-75">
                {!isAvailable ? 'Ocupado' : isSelected ? 'Seleccionado' : 'Disponible'}
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedTimeSlot && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
            <span className="text-sm font-medium text-primary">
              Horario seleccionado: {selectedTimeSlot} ({selectedBlock})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
