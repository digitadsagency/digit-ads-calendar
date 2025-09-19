'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la página de clientes
    router.push('/client');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al panel de clientes...</p>
        <div className="mt-4">
          <Button
            onClick={() => router.push('/client')}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Ir al Panel de Clientes
          </Button>
        </div>
      </div>
    </div>
  );
}