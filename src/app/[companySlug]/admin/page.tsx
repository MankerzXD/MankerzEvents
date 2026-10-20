import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/actions/auth-actions';
import { getCompanyBySlug } from '@/actions/company-actions';
import { getSorteosByCompanyId, getParticipacionesByCompanyId } from '@/actions/sorteo-actions';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Navbar } from '@/components/Navbar';
import { CreateSorteoForm } from '@/components/CreateSorteoForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    companySlug: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    return { title: 'Empresa No Encontrada' };
  }

  return {
    title: `Admin Panel — ${company.name}`,
    description: `Panel de control para la administración de sorteos de ${company.name}.`,
  };
}

export default async function TenantAdminPage({ params }: Props) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const user = await getCurrentUser();

  // 1. Authentication check
  if (!user) {
    redirect(`/login?returnUrl=/${company.slug}/admin`);
  }

  // 2. STRICT RBAC CHECK:
  // Only the company's registered admin_email or the Super Admin can access this panel
  const isCompanyAdmin =
    user.email?.toLowerCase() === company.admin_email?.toLowerCase();
  const isSuperAdmin =
    user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (!isCompanyAdmin && !isSuperAdmin) {
    redirect(
      `/unauthorized?requiredEmail=${encodeURIComponent(company.admin_email)}&currentEmail=${encodeURIComponent(user.email || 'anónimo')}`
    );
  }

  const sorteos = await getSorteosByCompanyId(company.id);
  const participaciones = await getParticipacionesByCompanyId(company.id);

  // Compute metrics
  const totalRaised = participaciones.reduce((acc, p) => acc + (p.total_amount || 0), 0);
  const totalTicketsSold = participaciones.reduce((acc, p) => acc + (p.ticket_count || 0), 0);
  const activeSorteosCount = sorteos.filter((s) => s.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner if Super Admin visits Company Admin */}
        {isSuperAdmin && !isCompanyAdmin && (
          <div className="bg-neutral-900 text-white p-3 px-4 flex items-center justify-between text-xs">
            <span>
              Acceso maestro como <span className="font-mono font-bold">{SUPER_ADMIN_EMAIL}</span> (Super Admin).
            </span>
            <Link
              href="/super-admin/dashboard"
              className="underline hover:no-underline font-semibold uppercase tracking-wider"
            >
              Volver a Panel Super Admin →
            </Link>
          </div>
        )}

        {/* Company Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase">
                PANEL DE ADMINISTRACIÓN
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                Admin: {company.admin_email}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {company.name}
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Gestión de sorteos, asignación de números y monitoreo de ventas de participaciones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${company.slug}`}
              target="_blank"
              className="px-3.5 py-1.5 text-xs font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <span>Ver Página Pública</span>
              <span className="font-mono text-neutral-400">↗</span>
            </Link>
          </div>
        </div>

        {/* Flat Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Recaudación Total
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              ${totalRaised.toFixed(2)}{' '}
              <span className="text-xs font-normal text-neutral-500">USD</span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Por venta de números en sorteos
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Participaciones Vendidas
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              {totalTicketsSold}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Tickets asignados a compradores
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Sorteos Activos
            </p>
            <p className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
              {activeSorteosCount}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Disponibles en /{company.slug}
            </p>
          </div>
        </div>

        {/* Section 1: Create New Sorteo Form */}
        <CreateSorteoForm
          companyId={company.id}
          companySlug={company.slug}
        />

        {/* Section 2: Sorteos List */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Sorteos Registrados en la Suite
              </h2>
              <p className="text-xs text-neutral-500">
                Eventos creados por {company.name} para la venta de números.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Total: {sorteos.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Título</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Premio</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Precio</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Vendidos / Total</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Fecha Sorteo</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sorteos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      Aún no has creado sorteos. Usa el botón &quot;+ Crear Nuevo Sorteo&quot; para comenzar.
                    </td>
                  </tr>
                ) : (
                  sorteos.map((sorteo) => (
                    <tr key={sorteo.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-900">
                        {sorteo.title}
                      </td>
                      <td className="py-3 px-4 text-neutral-800">
                        {sorteo.prize}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-900 font-semibold">
                        ${sorteo.ticket_price}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700">
                        {sorteo.sold_tickets} / {sorteo.total_tickets} ({Math.round((sorteo.sold_tickets / sorteo.total_tickets) * 100)}%)
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500">
                        {new Date(sorteo.draw_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-medium border border-neutral-300 bg-white text-neutral-800">
                          {sorteo.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Participaciones / Tickets Sold Table */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Participaciones y Números Vendidos
              </h2>
              <p className="text-xs text-neutral-500">
                Listado en vivo de participantes que compraron tickets desde /{company.slug}.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Total Compradores: {participaciones.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Comprador</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Contacto</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Cant. Números</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Números Asignados</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Monto Total</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Fecha</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {participaciones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      No se han registrado compras de números aún para esta empresa.
                    </td>
                  </tr>
                ) : (
                  participaciones.map((part) => (
                    <tr key={part.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-900">
                        {part.buyer_name}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        <span className="block font-mono text-[11px]">{part.buyer_email}</span>
                        <span className="block text-[11px] text-neutral-400">{part.buyer_phone}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                        {part.ticket_count}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {part.ticket_numbers?.map((num) => (
                            <span
                              key={num}
                              className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800 text-[10px] font-mono"
                            >
                              #{String(num).padStart(3, '0')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-900 font-semibold">
                        ${part.total_amount?.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                        {new Date(part.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border border-neutral-300 text-neutral-800 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {part.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
