'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Alert from '@/components/Alert';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    // Verificar si ya está autenticado
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setAlert({
        type: 'error',
        message: 'Por favor ingresa la contraseña.',
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Inicio de sesión exitoso. Redirigiendo...',
        });
        
        // Redirigir al panel de admin
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      }
    } catch (error) {
      console.error('Error en login:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error de autenticación.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso de Administrador
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa la contraseña para acceder al panel de administración
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {alert && (
            <Alert type={alert.type}>
              {alert.message}
            </Alert>
          )}

          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Contraseña de administrador"
              disabled={loading}
            />
          </div>

          <div>
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>
          </div>

          <div className="text-center">
            <a
              href="/"
              className="text-primary hover:text-blue-700 text-sm font-medium"
            >
              ← Volver al inicio
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
