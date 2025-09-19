'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminTable from '@/components/AdminTable';
import UserManagement from '@/components/UserManagement';
import ClientDropdown from '@/components/ClientDropdown';
import Alert from '@/components/Alert';
import Button from '@/components/Button';
import { Reservation, ClientUser } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    // Verificar autenticación
    checkAuth();
    // Cargar reservas
    loadReservations();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      router.push('/admin/login');
    }
  };

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reservations');
      
      if (!response.ok) {
        throw new Error('Error cargando reservas');
      }

      const data: Reservation[] = await response.json();
      setReservations(data);
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setAlert({
        type: 'error',
        message: 'Error cargando las reservas. Por favor recarga la página.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const response = await fetch('/api/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cancelando reserva');
      }

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Reserva cancelada exitosamente.',
        });
        
        // Recargar reservas
        await loadReservations();
      }
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error cancelando la reserva.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reservas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona las reservas de grabación y usuarios cliente
          </p>
        </div>
        
        <div className="flex space-x-4">
          <Button
            variant="secondary"
            onClick={loadReservations}
            loading={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="secondary"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {alert && (
        <div className="mb-6">
          <Alert type={alert.type}>
            {alert.message}
          </Alert>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reservas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reservations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reservations.filter(r => r.estado === 'confirmada').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reservations.filter(r => r.estado === 'cancelada').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de reservas - PRIMERA PRIORIDAD */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📅 Reservas de Grabación
          </h2>
          <div className="text-sm text-gray-500">
            {selectedClient ? `Filtrado por: ${selectedClient.name}` : 'Mostrando todas las reservas'}
          </div>
        </div>
        <AdminTable
          reservations={selectedClient ? reservations.filter(r => r.cliente_nombre === selectedClient.name) : reservations}
          onCancelReservation={handleCancelReservation}
          loading={loading}
        />
      </div>

      {/* Selector de cliente - SEGUNDA PRIORIDAD */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 Filtrar por Cliente
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona un cliente para ver solo sus reservas, o deja vacío para ver todas las reservas.
        </p>
        <ClientDropdown 
          onClientSelect={setSelectedClient}
          selectedClient={selectedClient}
          className="max-w-md"
        />
        {selectedClient && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Cliente Seleccionado:</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Nombre:</strong> {selectedClient.name}</p>
              <p><strong>Email:</strong> {selectedClient.email}</p>
              <p><strong>Empresa:</strong> {selectedClient.company}</p>
              <p><strong>Límite mensual:</strong> {selectedClient.monthlyLimit} reserva{selectedClient.monthlyLimit !== 1 ? 's' : ''}</p>
              <p><strong>Estado:</strong> {selectedClient.is_active ? 'Activo' : 'Inactivo'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Gestión de usuarios - TERCERA PRIORIDAD */}
      <UserManagement />
    </div>
  );
}
