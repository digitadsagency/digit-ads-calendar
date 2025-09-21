'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/DatePicker';
import BlockSelector from '@/components/BlockSelector';
import BookingForm, { BookingFormData } from '@/components/BookingForm';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { formatDateForDisplay } from '@/lib/date';
import { TimeSlot } from '@/lib/config';

interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  monthlyLimit: number;
}

interface UserReservation {
  id: string;
  userId: string;
  fecha: string;
  bloque: 'Mañana' | 'Tarde';
  horario: string;
  cliente_nombre: string;
  empresa_marca: string;
  direccion_grabacion: string;
  correo: string;
  notas: string;
  estado: 'confirmada' | 'cancelada';
  codigo_reserva: string;
  creado_en: string;
  actualizado_en: string;
}

interface AvailabilityResponse {
  morningAvailable: boolean;
  afternoonAvailable: boolean;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<'Mañana' | 'Tarde' | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse>({
    morningAvailable: true,
    afternoonAvailable: true,
  });
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [currentMonthReservations, setCurrentMonthReservations] = useState(0);
  
  // Debug: Log cuando cambie el contador
  useEffect(() => {
    console.log('🔧 Contador de reservas mensuales cambió a:', currentMonthReservations);
  }, [currentMonthReservations]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancellingReservation, setCancellingReservation] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{
    code: string;
    date: string;
    block: string;
    name: string;
  } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    } else {
      setSelectedBlock(null);
    }
  }, [selectedDate]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/users/auth');
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setAuthenticated(true);
        loadReservations();
      } else {
        router.push('/client/login');
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      router.push('/client/login');
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      console.log('🔄 Cargando reservas...');
      const response = await fetch('/api/users/reservations');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Reservas cargadas:', data.reservations);
        setReservations(data.reservations);
        
        // Calcular reservas del mes actual (solo confirmadas)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const currentMonthReservations = data.reservations.filter((reservation: UserReservation) => {
          // Para reservas canceladas sin fecha, usar la fecha de actualización
          const fecha = reservation.fecha || reservation.actualizado_en || '';
          if (!fecha) return false;
          
          const [year, month] = fecha.split('-').map(Number);
          return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
        });
        
        console.log('📊 Reservas del mes actual:', {
          total: data.reservations.length,
          confirmedThisMonth: currentMonthReservations.length,
          reservations: currentMonthReservations.map((r: UserReservation) => ({ id: r.id, fecha: r.fecha, estado: r.estado }))
        });
        console.log('🔧 Estableciendo contador a:', currentMonthReservations.length);
        setCurrentMonthReservations(currentMonthReservations.length);
      } else {
        console.error('❌ Error en respuesta de reservas:', data);
      }
    } catch (error) {
      console.error('❌ Error cargando reservas:', error);
    }
  };

  const checkAvailability = async (date: string) => {
    try {
      console.log('🔍 Verificando disponibilidad para:', date);
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      const data = await response.json();
      console.log('📊 Respuesta de disponibilidad:', data);
      
      if (data.success) {
        setAvailability(data);
        setSelectedBlock(null);
        console.log('✅ Disponibilidad actualizada:', data);
      } else {
        console.error('❌ Error en respuesta de disponibilidad:', data);
        setAlert({
          type: 'warning',
          message: 'No se pudo verificar la disponibilidad',
        });
      }
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      setAlert({
        type: 'warning',
        message: 'No se pudo verificar la disponibilidad',
      });
    }
  };

  const loadAvailableTimeSlots = async (date: string, block: 'Mañana' | 'Tarde') => {
    try {
      console.log('🔍 Cargando horarios disponibles para:', date, block);
      const response = await fetch('/api/time-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, block }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Horarios disponibles:', data.availableTimeSlots);
        setAvailableTimeSlots(data.availableTimeSlots);
      } else {
        console.error('❌ Error cargando horarios disponibles');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Error cargando horarios disponibles:', error);
      setAvailableTimeSlots([]);
    }
  };

  const handleDateChange = async (date: string) => {
    console.log('📅 Fecha seleccionada:', date);
    setSelectedDate(date);
    setSelectedBlock(null);
    setSelectedTimeSlot(null);
    setAvailableTimeSlots([]);
    await checkAvailability(date);
  };

  const handleBlockChange = async (block: 'Mañana' | 'Tarde') => {
    console.log('⏰ Bloque seleccionado:', block);
    setSelectedBlock(block);
    setSelectedTimeSlot(null);
    if (selectedDate) {
      await loadAvailableTimeSlots(selectedDate, block);
    }
  };

  const handleBookingSubmit = async (formData: BookingFormData) => {
    if (!selectedDate || !selectedBlock || !selectedTimeSlot) {
      setAlert({
        type: 'error',
        message: 'Por favor selecciona una fecha, bloque y horario específico',
      });
      return;
    }

    // Prevenir doble clic
    if (bookingLoading) {
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch('/api/users/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          block: selectedBlock,
          timeSlot: selectedTimeSlot,
          name: formData.name,
          brand: formData.brand,
          direccion_grabacion: formData.direccion_grabacion,
          correo: formData.correo,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingSuccess({
          code: data.code,
          date: selectedDate,
          block: selectedBlock,
          name: formData.name,
        });
        // Guardar la fecha antes de resetear para verificar disponibilidad
        const bookedDate = selectedDate;
        setSelectedDate('');
        setSelectedBlock(null);
        loadReservations();
        await checkAvailability(bookedDate);
      } else {
        // Mostrar mensaje específico para límite de reservas
        if (data.limitReached) {
          setAlert({
            type: 'warning',
            message: `⚠️ ${data.error} 📅 Puedes ver tus reservas actuales en la sección de abajo.`,
          });
        } else {
          setAlert({
            type: 'error',
            message: data.error || 'Error creando la reserva',
          });
        }
      }
    } catch (error) {
      console.error('Error creando reserva:', error);
      setAlert({
        type: 'error',
        message: 'Error creando la reserva',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string, reservationDate: string) => {
    // Verificar si se puede cancelar (24 horas antes)
    const now = new Date();
    const reservationDateTime = new Date(reservationDate + 'T00:00:00');
    const diffInHours = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      setAlert({
        type: 'error',
        message: 'Solo puedes cancelar reservas con al menos 24 horas de anticipación',
      });
      return;
    }

    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    setCancellingReservation(reservationId);
    try {
      const response = await fetch('/api/users/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Reserva cancelada exitosamente');
        setAlert({
          type: 'success',
          message: 'Reserva cancelada exitosamente',
        });
        
        // Actualizar estado local inmediatamente
        console.log('🔄 Actualizando estado local inmediatamente...');
        setReservations(prev => {
          const updated = prev.map(res => 
            res.id === reservationId 
              ? { ...res, estado: 'cancelada' as const }
              : res
          );
          console.log('📊 Estado local actualizado:', updated);
          
          // Calcular contador mensual inmediatamente
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          
          const currentMonthReservations = updated.filter((reservation: UserReservation) => {
            const fecha = reservation.fecha || reservation.actualizado_en || '';
            if (!fecha) return false;
            
            const [year, month] = fecha.split('-').map(Number);
            return year === currentYear && month === currentMonth && reservation.estado === 'confirmada';
          });
          
          console.log('📊 Contador mensual actualizado:', {
            total: updated.length,
            confirmedThisMonth: currentMonthReservations.length,
            reservations: currentMonthReservations.map((r: UserReservation) => ({ id: r.id, fecha: r.fecha, estado: r.estado }))
          });
          
          setCurrentMonthReservations(currentMonthReservations.length);
          
          return updated;
        });
        
        // Recargar del servidor después de un pequeño delay para sincronizar
        console.log('✅ Cancelación completada - recargando del servidor en 1 segundo...');
        setTimeout(() => {
          loadReservations();
        }, 1000);
      } else {
        setAlert({
          type: 'error',
          message: data.error || 'Error cancelando la reserva',
        });
      }
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      setAlert({
        type: 'error',
        message: 'Error cancelando la reserva',
      });
    } finally {
      setCancellingReservation(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      router.push('/client/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del cliente */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido, {user.name}
              </h1>
              <p className="text-gray-600">{user.company}</p>
              <p className="text-sm text-gray-500">
                Límite mensual: {user.monthlyLimit} reserva(s)
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {alert && (
          <Alert
            type={alert.type}
          >
            <div className="flex justify-between items-center">
              <span>{alert.message}</span>
              <button
                onClick={() => setAlert(null)}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </Alert>
        )}

        {bookingSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  ¡Reserva confirmada!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Código de reserva:</strong> {bookingSuccess.code}</p>
                  <p><strong>Fecha:</strong> {formatDateForDisplay(bookingSuccess.date)}</p>
                  <p><strong>Horario:</strong> {bookingSuccess.block}</p>
                  <p><strong>Cliente:</strong> {bookingSuccess.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Panel de reserva desplegable */}
          <div className="bg-white rounded-lg shadow">
            <button
              onClick={() => setShowBookingPanel(!showBookingPanel)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Nueva Reserva
                </h2>
                {user && (
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    currentMonthReservations >= user.monthlyLimit
                      ? 'bg-red-100 text-red-800'
                      : currentMonthReservations >= user.monthlyLimit - 1
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {currentMonthReservations}/{user.monthlyLimit} reservas este mes
                  </div>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  showBookingPanel ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBookingPanel && (
              <div className="px-6 pb-6 space-y-6">
                {user && currentMonthReservations >= user.monthlyLimit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Límite de reservas alcanzado
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>Has alcanzado tu límite mensual de {user.monthlyLimit} reserva(s).</p>
                          <p>Intenta en el próximo mes o contacta al administrador si necesitas más reservas.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  disabled={user ? currentMonthReservations >= user.monthlyLimit : false}
                />

                {selectedDate && (
                  <BlockSelector
                    selectedBlock={selectedBlock}
                    onBlockChange={handleBlockChange}
                    morningAvailable={availability.morningAvailable}
                    afternoonAvailable={availability.afternoonAvailable}
                    disabled={user ? currentMonthReservations >= user.monthlyLimit : false}
                  />
                )}

                {selectedDate && selectedBlock && (
                  <BookingForm
                    selectedDate={selectedDate}
                    selectedBlock={selectedBlock}
                    selectedTimeSlot={selectedTimeSlot}
                    onTimeSlotSelect={setSelectedTimeSlot}
                    availableTimeSlots={availableTimeSlots}
                    onSubmit={handleBookingSubmit}
                    loading={bookingLoading}
                  />
                )}
              </div>
            )}
          </div>

          {/* Historial de reservas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Mis Reservas ({reservations.length})
            </h2>
            
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tienes reservas aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => {
                  const now = new Date();
                  const reservationDateTime = new Date(reservation.fecha + 'T00:00:00');
                  const diffInHours = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const canCancel = diffInHours >= 24 && reservation.estado === 'confirmada';
                  
                  return (
                    <div
                      key={reservation.id}
                      className={`border rounded-lg p-4 ${
                        reservation.estado === 'confirmada'
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {formatDate(reservation.fecha)} - {reservation.bloque}
                            {reservation.horario && ` (${reservation.horario})`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {reservation.empresa_marca}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reservation.direccion_grabacion}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Código: {reservation.codigo_reserva}
                          </p>
                          {reservation.estado === 'confirmada' && !canCancel && diffInHours > 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Solo se puede cancelar con 24h de anticipación
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            reservation.estado === 'confirmada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reservation.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                          </span>
                          {canCancel && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id, reservation.fecha)}
                              disabled={cancellingReservation === reservation.id}
                              className={`text-xs font-medium underline ${
                                cancellingReservation === reservation.id
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-800'
                              }`}
                            >
                              {cancellingReservation === reservation.id ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
