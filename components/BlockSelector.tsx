'use client';

import React from 'react';
import { BlockType } from '@/lib/config';

interface BlockSelectorProps {
  selectedBlock: BlockType | null;
  onBlockChange: (block: BlockType) => void;
  morningAvailable: boolean;
  afternoonAvailable: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export default function BlockSelector({
  selectedBlock,
  onBlockChange,
  morningAvailable,
  afternoonAvailable,
  disabled = false,
  loading = false,
}: BlockSelectorProps) {
  const blocks = [
    {
      id: 'Mañana' as BlockType,
      label: 'Mañana',
      time: '10:00 - 13:00',
      description: 'Horarios: 10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 13:00',
      available: morningAvailable,
    },
    {
      id: 'Tarde' as BlockType,
      label: 'Tarde',
      time: '16:00 - 17:30',
      description: 'Horarios: 16:00, 16:30, 17:00, 17:30',
      available: afternoonAvailable,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Selecciona el horario:</h3>
        {loading && (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verificando disponibilidad...
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map(block => (
          <label
            key={block.id}
            className={`
              relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
              ${selectedBlock === block.id
                ? 'border-primary bg-blue-50'
                : block.available
                  ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="block"
              value={block.id}
              checked={selectedBlock === block.id}
              onChange={() => onBlockChange(block.id)}
              disabled={disabled || !block.available}
              className="sr-only"
            />
            
            <div className="flex items-center w-full">
              <div className={`
                w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                ${selectedBlock === block.id
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
                }
              `}>
                {selectedBlock === block.id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">{block.label}</div>
                <div className="text-sm text-gray-600">{block.time}</div>
                <div className="text-xs text-gray-500 mt-1">{block.description}</div>
                {!block.available && (
                  <div className="text-sm text-red-600 font-medium">No disponible</div>
                )}
              </div>
              
              {selectedBlock === block.id && (
                <div className="text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {!morningAvailable && !afternoonAvailable && (
        <div className="text-center py-4">
          <div className="text-red-600 font-medium">
            No hay horarios disponibles para esta fecha
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Por favor selecciona otra fecha
          </div>
        </div>
      )}
    </div>
  );
}
