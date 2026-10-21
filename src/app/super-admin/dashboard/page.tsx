import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth-actions';
import { getCompanies } from '@/actions/company-actions';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Navbar } from '@/components/Navbar';
import { CreateCompanyForm } from '@/components/CreateCompanyForm';
import { CompanySubscriptionToggle } from '@/components/CompanySubscriptionToggle';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Super Admin Dashboard — Mankerz Events',
  description: 'Panel de control exclusivo para el Super Administrador.',
};

export default async function SuperAdminDashboard() {
  const user = await getCurrentUser();

  // Strict check: Only sanchezmanuel397@gmail.com is permitted
  if (!user || user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    redirect(`/unauthorized?requiredEmail=${SUPER_ADMIN_EMAIL}&currentEmail=${user?.email || 'anonimo'}`);
  }

  const companies = await getCompanies();

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase">
                SUPER ADMIN EXCLUSIVO
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {SUPER_ADMIN_EMAIL}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Panel de Control Multi-Tenant
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Gestión centralizada de inquilinos (empresas), aislamiento de bases de datos y roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-300 text-xs text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Sistema Operativo
            </span>
          </div>
        </div>

        {/* Flat Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Empresas (Tenants)
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              {companies.length}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Inquilinos activos en PostgreSQL
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Aislamiento RLS
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              100%
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              company_id obligatorio por fila
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Rol Activo
            </p>
            <p className="text-xl font-bold text-neutral-900 mt-2 font-mono">
              Super Admin
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 truncate">
              Privilegio raíz ({SUPER_ADMIN_EMAIL})
            </p>
          </div>
        </div>

        {/* Section 1: Create Tenant Form */}
        <CreateCompanyForm />

        {/* Section 2: Companies List Table */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Empresas Registradas en el Sistema
              </h2>
              <p className="text-xs text-neutral-500">
                Listado completo de clientes corporativos y sus identificadores únicos.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Total: {companies.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Nombre de Empresa</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Slug / Subdominio</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Admin Contacto</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Fecha Creación</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Estado</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Módulo Suscripciones</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      {company.name}
                      {company.description && (
                        <span className="block text-[11px] text-neutral-500 font-normal mt-0.5">
                          {company.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-700">
                      /{company.slug}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">
                      {company.admin_email || '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono">
                      {new Date(company.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium border border-neutral-300 bg-white text-neutral-800 uppercase">
                        {company.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <CompanySubscriptionToggle
                        companyId={company.id}
                        initialEnabled={company.has_subscriptions}
                        companyName={company.name}
                      />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <a
                        href={`/${company.slug}`}
                        target="_blank"
                        className="inline-block px-2.5 py-1 text-[11px] font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors"
                      >
                        Página Pública ↗
                      </a>
                      <a
                        href={`/${company.slug}/admin`}
                        className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                      >
                        Panel Admin →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
