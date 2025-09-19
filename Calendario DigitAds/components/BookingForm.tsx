'use client';

import React, { useState } from 'react';
import { BlockType, TimeSlot } from '@/lib/config';
import { formatDateForDisplay } from '@/lib/date';
import Button from './Button';
import Alert from './Alert';
import TimeSlotSelector from './TimeSlotSelector';

interface BookingFormProps {
  selectedDate: string;
  selectedBlock: BlockType | null;
  selectedTimeSlot: TimeSlot | null;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  availableTimeSlots: TimeSlot[];
  onSubmit: (data: BookingFormData) => Promise<void>;
  loading?: boolean;
}

export interface BookingFormData {
  name: string;
  brand: string;
  direccion_grabacion: string;
  correo: string;
  notes: string;
}

export default function BookingForm({
  selectedDate,
  selectedBlock,
  selectedTimeSlot,
  onTimeSlotSelect,
  availableTimeSlots,
  onSubmit,
  loading = false,
}: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    brand: '',
    direccion_grabacion: '',
    correo: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof BookingFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'La empresa/marca es requerida';
    }

    if (!formData.direccion_grabacion.trim()) {
      newErrors.direccion_grabacion = 'La dirección de grabación es requerida';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El correo electrónico no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error enviando formulario:', error);
    }
  };

  const isFormValid = selectedDate && selectedBlock && selectedTimeSlot && formData.name && formData.brand && formData.direccion_grabacion && formData.correo;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumen de la reserva */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Resumen de tu Reserva
        </h3>
        <div className="text-sm text-blue-800">
          <p><strong>Fecha:</strong> {formatDateForDisplay(selectedDate)}</p>
          <p><strong>Bloque:</strong> {selectedBlock}</p>
          {selectedTimeSlot && (
            <p><strong>Horario:</strong> {selectedTimeSlot}</p>
          )}
        </div>
      </div>

      {/* Selector de horario específico */}
      {selectedBlock && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <TimeSlotSelector
            selectedBlock={selectedBlock}
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotSelect={onTimeSlotSelect}
            availableTimeSlots={availableTimeSlots}
            loading={loading}
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información del Cliente
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                ${errors.name ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Tu nombre completo"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              Empresa/Marca *
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                ${errors.brand ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Nombre de tu empresa o marca"
              disabled={loading}
            />
            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
            )}
          </div>

          <div>
            <label htmlFor="direccion_grabacion" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección de grabación *
            </label>
            <input
              type="text"
              id="direccion_grabacion"
              name="direccion_grabacion"
              value={formData.direccion_grabacion}
              onChange={handleInputChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                ${errors.direccion_grabacion ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Dirección donde se realizará la grabación"
              disabled={loading}
            />
            {errors.direccion_grabacion && (
              <p className="mt-1 text-sm text-red-600">{errors.direccion_grabacion}</p>
            )}
          </div>

          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                ${errors.correo ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="tu@email.com"
              disabled={loading}
            />
            {errors.correo && (
              <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas adicionales
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Cuéntanos sobre tu proyecto, ideas, o cualquier información adicional..."
            disabled={loading}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Resumen de tu reserva:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Fecha:</strong> {selectedDate ? formatDateForDisplay(selectedDate) : 'No seleccionada'}</p>
          <p><strong>Horario:</strong> {selectedBlock || 'No seleccionado'}</p>
          <p><strong>Cliente:</strong> {formData.name || 'No especificado'}</p>
          <p><strong>Marca:</strong> {formData.brand || 'No especificada'}</p>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        loading={loading}
        disabled={!isFormValid || loading}
        className="w-full"
      >
        {loading ? 'Procesando reserva...' : 'Confirmar Reserva'}
      </Button>
    </form>
  );
}
