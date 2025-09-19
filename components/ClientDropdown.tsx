'use client';

import { useState, useEffect } from 'react';
import { ClientUser } from '@/lib/types';

interface ClientDropdownProps {
  onClientSelect: (client: ClientUser | null) => void;
  selectedClient: ClientUser | null;
  className?: string;
}

export default function ClientDropdown({ 
  onClientSelect, 
  selectedClient, 
  className = '' 
}: ClientDropdownProps) {
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.users || []);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientSelect = (client: ClientUser) => {
    onClientSelect(client);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onClientSelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">
          Cliente:
        </label>
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {selectedClient ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{selectedClient.name}</div>
                  <div className="text-sm text-gray-500">{selectedClient.email}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedClient.monthlyLimit} reserva{selectedClient.monthlyLimit !== 1 ? 's' : ''}/mes
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-gray-500">
                {loading ? 'Cargando clientes...' : 'Seleccionar cliente'}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleClientSelect(client)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                          <div className="text-xs text-gray-400">{client.company}</div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            client.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {client.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {client.monthlyLimit} reserva{client.monthlyLimit !== 1 ? 's' : ''}/mes
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
