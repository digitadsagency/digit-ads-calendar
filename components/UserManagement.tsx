'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Alert from './Alert';

interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  monthlyLimit: number;
  whatsapp?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  company: string;
  monthlyLimit: number;
  whatsapp: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    company: '',
    monthlyLimit: 1,
    whatsapp: '',
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setAlert({ type: 'error', message: 'Error cargando usuarios' });
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setAlert({ type: 'error', message: 'Error cargando usuarios' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyLimit' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name || !formData.company) {
      setAlert({ type: 'error', message: 'Todos los campos son requeridos' });
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ 
          type: 'success', 
          message: `Usuario creado exitosamente. Credenciales: ${formData.email} / ${formData.password}` 
        });
        setFormData({
          email: '',
          password: '',
          name: '',
          company: '',
          monthlyLimit: 1,
          whatsapp: '',
        });
        setShowForm(false);
        loadUsers();
      } else {
        setAlert({ type: 'error', message: data.error || 'Error creando usuario' });
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      setAlert({ type: 'error', message: 'Error creando usuario' });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ 
          type: 'success', 
          message: `Usuario "${userName}" eliminado exitosamente` 
        });
        loadUsers();
      } else {
        setAlert({ type: 'error', message: data.error || 'Error eliminando usuario' });
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      setAlert({ type: 'error', message: 'Error eliminando usuario' });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios Cliente</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {showForm ? 'Cancelar' : 'Crear Usuario'}
        </Button>
      </div>

      {alert && (
        <Alert type={alert.type}>
          {alert.message}
        </Alert>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Contraseña temporal"
                  required
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="monthlyLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  Límite Mensual *
                </label>
                <select
                  id="monthlyLimit"
                  name="monthlyLimit"
                  value={formData.monthlyLimit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value={1}>1 reserva</option>
                  <option value={2}>2 reservas</option>
                  <option value={3}>3 reservas</option>
                  <option value={4}>4 reservas</option>
                  <option value={5}>5 reservas</option>
                </select>
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+52 55 1234 5678"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white hover:bg-primary/90"
              >
                Crear Usuario
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Usuarios Registrados ({users.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary truncate">
                      {user.name}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Eliminar usuario"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <p className="truncate">
                        <strong>Email:</strong> {user.email}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <p className="truncate">
                        <strong>Empresa:</strong> {user.company}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <p className="truncate">
                        <strong>Límite mensual:</strong> {user.monthlyLimit} reserva(s)
                      </p>
                    </div>
                    {user.whatsapp && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          <strong>WhatsApp:</strong> {user.whatsapp}
                        </p>
                      </div>
                    )}
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <p className="truncate">
                        <strong>Creado:</strong> {formatDate(user.created_at)}
                      </p>
                    </div>
                    {user.last_login && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          <strong>Último acceso:</strong> {formatDate(user.last_login)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
}
