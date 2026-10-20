import Link from 'next/link';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Navbar } from '@/components/Navbar';

interface Props {
  searchParams: Promise<{
    requiredEmail?: string;
    currentEmail?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Acceso Denegado — Mankerz Events',
  description: 'Ruta protegida para el Super Administrador.',
};

export default async function UnauthorizedPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentEmail = params.currentEmail || 'Usuario no autenticado';
  const requiredEmail = params.requiredEmail || SUPER_ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border border-neutral-300 p-8 space-y-6">
          <div className="inline-block px-2.5 py-1 bg-red-100 text-red-800 text-xs font-mono font-bold uppercase tracking-wider border border-red-300">
            HTTP 403 — ACCESO RESTRINGIDO
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Permisos Insuficientes para este Panel
            </h1>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              El guardián de rutas y el middleware de Next.js han bloqueado el acceso a esta sección. Solo el administrador autorizado puede gestionar este panel.
            </p>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs space-y-2 font-mono">
            <div>
              <span className="text-neutral-500">Email Autenticado: </span>
              <span className="text-neutral-900 font-semibold">{currentEmail}</span>
            </div>
            <div>
              <span className="text-neutral-500">Email Requerido: </span>
              <span className="text-neutral-900 font-semibold">{requiredEmail}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              Ir a Company Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors"
            >
              Cambiar de Cuenta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
