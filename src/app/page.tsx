import Link from 'next/link';
import { getCurrentUser } from '@/actions/auth-actions';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Navbar } from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-neutral-300 text-xs font-mono text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-neutral-900"></span>
            Multi-Tenant SaaS Architecture • MVP
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Plataforma Multi-Tenant de Eventos y Sorteos
          </h1>

          <p className="text-base text-neutral-600 leading-relaxed">
            Arquitectura moderna con Next.js (App Router), TypeScript, Tailwind CSS y Supabase PostgreSQL.
            Diseño estrictamente plano (<span className="text-neutral-900 font-medium">Flat Design</span>), control de acceso por roles (RBAC) y aislamiento de datos por empresa.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/super-admin/dashboard"
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900"
            >
              Super Admin Dashboard →
            </Link>
            <Link
              href="/demo-eventos/admin"
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-white text-neutral-900 hover:bg-neutral-100 transition-colors border border-neutral-300"
            >
              Company Admin Dashboard →
            </Link>
            <Link
              href="/login"
              className="px-4 py-2.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 underline"
            >
              Cambiar Rol / Login
            </Link>
          </div>
        </div>

        {/* Current Session Banner */}
        <div className="bg-white border border-neutral-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Estado de la Sesión Actual
            </h2>
            <span className="text-[11px] font-mono text-neutral-500">
              {user ? 'Autenticado' : 'Sin Sesión'}
            </span>
          </div>

          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-neutral-600 font-mono mt-0.5">
                  Email: {user.email} • Rol: <span className="font-bold text-neutral-900 uppercase">{user.role}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user.email === SUPER_ADMIN_EMAIL ? (
                  <span className="px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-mono font-medium">
                    Super Admin Autorizado
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 text-neutral-800 text-[11px] font-mono">
                    Company Admin / Suscriptor
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-600">
              Actualmente no has iniciado sesión. Puedes acceder a{' '}
              <Link href="/login" className="font-semibold text-neutral-900 underline">
                /login
              </Link>{' '}
              para probar con 1 click las vistas de Super Admin o Company Admin.
            </p>
          )}
        </div>

        {/* Core Pillars (Flat Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200 p-6 space-y-3">
            <div className="w-8 h-8 border border-neutral-300 flex items-center justify-center font-bold text-xs font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Super Admin Exclusivo
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Únicamente <span className="font-mono text-neutral-900 font-medium">{SUPER_ADMIN_EMAIL}</span> puede ver el panel supremo y ejecutar la Server Action <code className="text-neutral-900">createCompany()</code>.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 space-y-3">
            <div className="w-8 h-8 border border-neutral-300 flex items-center justify-center font-bold text-xs font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Company Admin (Tenant)
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Los administradores de cada empresa creada únicamente tienen visibilidad y control sobre los sorteos y compradores de su propia empresa mediante RLS estricto.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 space-y-3">
            <div className="w-8 h-8 border border-neutral-300 flex items-center justify-center font-bold text-xs font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Diseño Flat & Minimalista
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Líneas limpias, bordes de 1px, tipografía oscura con alto contraste, cero sombras pesadas, sin glassmorphism y enfocado 100% en usabilidad y datos.
            </p>
          </div>
        </div>

        {/* Database & Security Specs */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Especificaciones Técnicas Implementadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="font-bold text-neutral-900 block mb-1">
                Base de Datos (Supabase SQL)
              </span>
              <p className="text-neutral-600">
                Archivo <code className="text-neutral-900 font-mono">supabase/schema.sql</code> listo con tablas <code className="text-neutral-900 font-mono">companies</code>, <code className="text-neutral-900 font-mono">profiles</code>, <code className="text-neutral-900 font-mono">subscriptions</code>, triggers y políticas RLS.
              </p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="font-bold text-neutral-900 block mb-1">
                Middleware de Rutas
              </span>
              <p className="text-neutral-600">
                Bloqueo a nivel de edge para <code className="text-neutral-900 font-mono">/super-admin/*</code> rechazando cualquier usuario que no coincida exactamente con el email del Super Admin.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-8 mt-16 text-center text-xs text-neutral-500">
        <p>mankerz events • SaaS Multi-Tenant • Next.js & Supabase</p>
      </footer>
    </div>
  );
}
