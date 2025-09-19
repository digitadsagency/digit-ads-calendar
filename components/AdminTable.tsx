'use client';

import React, { useState, useEffect } from 'react';
import { Reservation } from '@/lib/types';
import Button from './Button';
import Alert from './Alert';

interface AdminTableProps {
  reservations: Reservation[];
  onCancelReservation: (reservationId: string) => Promise<void>;
  loading?: boolean;
}

export default function AdminTable({ reservations, onCancelReservation, loading = false }: AdminTableProps) {
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>(reservations);
  const [filters, setFilters] = useState({
    date: '',
    block: '',
    status: '',
  });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Función para normalizar fechas
  const normalizeDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // Si es una fecha de Excel (número), convertirla
    if (!isNaN(Number(dateString))) {
      const excelDate = new Date((Number(dateString) - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }
    
    // Si ya es una fecha en formato YYYY-MM-DD, devolverla
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Si es otra fecha, intentar parsearla
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    let filtered = reservations;

    if (filters.date) {
      filtered = filtered.filter(r => {
        const normalizedReservationDate = normalizeDate(r.fecha);
        const normalizedFilterDate = normalizeDate(filters.date);
        
        // Debug temporal
        console.log('Comparando fechas:', {
          originalReservationDate: r.fecha,
          normalizedReservationDate,
          originalFilterDate: filters.date,
          normalizedFilterDate,
          match: normalizedReservationDate === normalizedFilterDate
        });
        
        return normalizedReservationDate === normalizedFilterDate;
      });
    }

    if (filters.block) {
      filtered = filtered.filter(r => r.bloque === filters.block);
    }

    if (filters.status) {
      filtered = filtered.filter(r => r.estado === filters.status);
    }

    setFilteredReservations(filtered);
  }, [reservations, filters]);

  const handleCancel = async (reservationId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    setCancellingId(reservationId);
    try {
      await onCancelReservation(reservationId);
    } catch (error) {
      console.error('Error cancelando reserva:', error);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const normalizedDate = normalizeDate(dateString);
    if (!normalizedDate) return dateString;
    
    try {
      const date = new Date(normalizedDate + 'T00:00:00');
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('es-ES');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    if (status === 'confirmada') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filter-date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="filter-date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="filter-block" className="block text-sm font-medium text-gray-700 mb-1">
              Bloque
            </label>
            <select
              id="filter-block"
              value={filters.block}
              onChange={(e) => setFilters(prev => ({ ...prev, block: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {filteredReservations.length} de {reservations.length} reservas
          </p>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters({ date: '', block: '', status: '' })}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bloque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección de Grabación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(reservation.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.bloque}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.horario || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.cliente_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.empresa_marca}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.direccion_grabacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.correo ? (
                      <a 
                        href={`mailto:${reservation.correo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {reservation.correo}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(reservation.estado)}>
                      {reservation.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {reservation.codigo_reserva}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(reservation.creado_en)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.estado === 'confirmada' && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancellingId === reservation.id}
                        onClick={() => handleCancel(reservation.id)}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron reservas con los filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );
}
