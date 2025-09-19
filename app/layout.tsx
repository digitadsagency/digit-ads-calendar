import type { Metadata } from 'next';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'Digit Ads | Agenda de Grabación',
  description: 'Sistema de reservas para sesiones de grabación de Digit Ads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Image
                    src="/logo DIGI.png"
                    alt="Digit Ads"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                    priority
                  />
                </div>
                       <nav className="flex space-x-4">
                         <a
                           href="/"
                           className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                         >
                           Reservar
                         </a>
                         <a
                           href="/client"
                           className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                         >
                           Cliente
                         </a>
                         <a
                           href="/admin"
                           className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                         >
                           Admin
                         </a>
                       </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="text-center text-sm text-gray-600">
                <p>&copy; 2024 Digit Ads. Todos los derechos reservados.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
