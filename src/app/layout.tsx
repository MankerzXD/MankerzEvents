import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mankerz Events — Multi-Tenant SaaS',
  description: 'Plataforma multi-tenant minimalista para gestión de sorteos, eventos y suscriptores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full bg-[#fbfbfb]">
      <body className="min-h-full flex flex-col font-sans antialiased text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
