import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/actions/auth-actions';
import { getSubscribersByCompany } from '@/actions/subscriber-actions';
import { Navbar } from '@/components/Navbar';
import { CompanySubscribersSection } from '@/components/CompanySubscribersSection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Company Dashboard — Mankerz Events',
  description: 'Panel de administración de empresa y suscriptores para sorteos.',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?returnUrl=/dashboard');
  }

  // Company ID: Demo company by default or user's assigned company
  const companyId = user.company_id || 'c1111111-1111-1111-1111-111111111111';
  const companyName = user.role === 'company_admin' || user.email?.includes('demoeventos') 
    ? 'Demo Eventos SRL' 
    : 'Mankerz Tenant Activo';

  const subscribers = await getSubscribersByCompany(companyId);

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner if Super Admin visits Company Dashboard */}
        {user.isSuperAdmin && (
          <div className="bg-neutral-900 text-white p-3 px-4 flex items-center justify-between text-xs">
            <span>
              Estás navegando en vista de Empresa como <span className="font-mono font-bold">{user.email}</span> (Super Admin).
            </span>
            <Link
              href="/super-admin/dashboard"
              className="underline hover:no-underline font-semibold uppercase tracking-wider"
            >
              Ir a Panel Super Admin →
            </Link>
          </div>
        )}

        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold tracking-widest uppercase border border-neutral-300">
                COMPANY ADMIN
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {user.email}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {companyName}
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Panel de gestión de suscriptores y sorteos de tu empresa. Aislamiento estricto multi-tenant.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">ID Empresa:</span>
            <code className="bg-neutral-100 px-2 py-1 text-neutral-800 font-mono text-[11px] border border-neutral-300">
              {companyId}
            </code>
          </div>
        </div>

        {/* Flat Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Suscriptores
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              {subscribers.length}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Usuarios registrados en {companyName}
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Sorteos Activos
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              0
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Sin eventos programados este mes
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Estado Tenant
            </p>
            <p className="text-xl font-bold text-neutral-900 mt-2 font-mono">
              Activo
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Aislado por RLS PostgreSQL
            </p>
          </div>
        </div>

        {/* Flat HTML Table for Subscribers */}
        <CompanySubscribersSection
          companyId={companyId}
          companyName={companyName}
          initialSubscribers={subscribers}
        />
      </main>
    </div>
  );
}
