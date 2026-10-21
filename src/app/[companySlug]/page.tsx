import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCompanyBySlug } from '@/actions/company-actions';
import { getSorteosByCompanyId } from '@/actions/sorteo-actions';
import { getExclusivePosts } from '@/actions/post-actions';
import { BuyTicketModal } from '@/components/BuyTicketModal';
import { SubscribeModal } from '@/components/SubscribeModal';
import { ExclusivePostsFeed } from '@/components/ExclusivePostsFeed';

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
    title: `${company.name} — Sorteos y Membresías Oficiales`,
    description: company.description || `Participa en los sorteos oficiales y contenido exclusivo de ${company.name}.`,
  };
}

export default async function TenantPublicPage({ params }: Props) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const sorteos = await getSorteosByCompanyId(company.id);
  const exclusivePosts = company.has_subscriptions
    ? await getExclusivePosts(company.id)
    : [];

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      {/* Flat Minimalist Tenant Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-neutral-900 inline-block"></span>
            <div>
              <span className="font-bold text-base tracking-tight text-neutral-900 block leading-tight">
                {company.name}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                events.mankerz.xyz/{company.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/"
              className="text-neutral-500 hover:text-neutral-900 hidden sm:inline"
            >
              mankerz suite
            </Link>
            <Link
              href={`/${company.slug}/admin`}
              className="px-3 py-1.5 font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <span>Acceso Admin</span>
              <span className="text-[10px] text-neutral-400 font-mono">→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Company Presentation */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-white border border-neutral-300 text-[11px] font-mono uppercase text-neutral-700">
              Página Oficial
            </span>
            {company.has_subscriptions && (
              <span className="px-2.5 py-0.5 bg-neutral-900 text-white text-[11px] font-mono uppercase">
                Suscripciones & Sorteos
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            {company.name}
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {company.description || 'Bienvenido a la página oficial. Adquiere tus números de participación para sorteos de manera independiente o únete a nuestra membresía mensual.'}
          </p>
        </div>

        {/* Optional Membership / Cafecito Card (if Super Admin enabled it) */}
        {company.has_subscriptions && (
          <div className="bg-white border-2 border-neutral-900 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-neutral-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-neutral-900"></span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-600">
                    Membresía Mensual • Estilo Cafecito
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                  {company.subscription_title || 'Cafecito VIP / Membresía'}
                </h2>
                <p className="text-xs text-neutral-600 max-w-xl leading-relaxed">
                  Apoya a {company.name} de forma mensual para desbloquear publicaciones secretas, beneficios preferenciales y participación en actividades especiales.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 p-4 min-w-[200px] text-right">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                  Aporte Mensual
                </span>
                <span className="text-2xl font-bold font-mono text-neutral-900">
                  ${company.subscription_price || 5.00} <span className="text-xs font-normal text-neutral-500">USD</span>
                </span>
                <span className="block text-[10px] text-neutral-400 mt-0.5">
                  Cancela cuando quieras
                </span>
              </div>
            </div>

            {/* Perks & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Beneficios Incluidos:
                </span>
                <p className="text-xs text-neutral-600">
                  ✓ {company.subscription_perks || 'Acceso al Muro VIP, noticias anticipadas y sorteos mensuales para miembros.'}
                </p>
              </div>

              <SubscribeModal
                companyId={company.id}
                companySlug={company.slug}
                companyName={company.name}
                planTitle={company.subscription_title || 'Cafecito VIP'}
                price={company.subscription_price || 5.00}
                perks={company.subscription_perks || 'Acceso a contenido VIP y beneficios exclusivos'}
              />
            </div>
          </div>
        )}

        {/* Raffles Grid (Independent from subscriptions) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 border-b border-neutral-200 gap-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Sorteos Oficiales ({sorteos.length})
              </h2>
              <span className="text-xs text-neutral-500 font-normal">
                — Compra de participaciones independientes
              </span>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              Participaciones verificadas al instante
            </span>
          </div>

          {sorteos.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 text-neutral-500 space-y-2">
              <p className="font-medium text-neutral-900 text-sm">
                No hay sorteos activos en este momento
              </p>
              <p className="text-xs text-neutral-500">
                El administrador de {company.name} publicará nuevos eventos próximamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sorteos.map((sorteo) => {
                const percentSold = Math.round((sorteo.sold_tickets / sorteo.total_tickets) * 100);
                const available = Math.max(0, sorteo.total_tickets - sorteo.sold_tickets);

                return (
                  <div
                    key={sorteo.id}
                    className="bg-white border border-neutral-200 p-6 flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Badge & Date */}
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-wider border border-neutral-300">
                          {sorteo.status === 'active' ? 'En Curso' : sorteo.status}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          Sortea: {new Date(sorteo.draw_date).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      {/* Title & Prize */}
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 leading-snug">
                          {sorteo.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                          {sorteo.description}
                        </p>
                      </div>

                      {/* Prize Highlight Box */}
                      <div className="p-3 bg-neutral-50 border border-neutral-200">
                        <span className="block text-[10px] font-mono uppercase text-neutral-500">
                          Premio a Sorteo
                        </span>
                        <span className="text-sm font-bold text-neutral-900">
                          {sorteo.prize}
                        </span>
                      </div>

                      {/* Progress of sold tickets */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-neutral-600">
                            {sorteo.sold_tickets} de {sorteo.total_tickets} números vendidos
                          </span>
                          <span className="font-bold text-neutral-900">
                            {percentSold}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 border border-neutral-300 overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 transition-all duration-300"
                            style={{ width: `${Math.min(100, percentSold)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-neutral-500 text-right">
                          Quedan {available} números disponibles
                        </p>
                      </div>
                    </div>

                    {/* Pricing & Buy Action */}
                    <div className="pt-4 border-t border-neutral-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-neutral-500">
                          Precio por Número
                        </span>
                        <span className="text-xl font-bold font-mono text-neutral-900">
                          ${sorteo.ticket_price} <span className="text-xs font-normal text-neutral-500">USD</span>
                        </span>
                      </div>

                      <BuyTicketModal
                        sorteo={sorteo}
                        companyId={company.id}
                        companySlug={company.slug}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Exclusive Posts / VIP Wall (Only shown if subscriptions enabled) */}
        {company.has_subscriptions && (
          <div className="space-y-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Muro VIP & Contenido Exclusivo ({exclusivePosts.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Publicaciones y novedades reservadas para miembros de la suscripción mensual.
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                🔒 Área Protegida
              </span>
            </div>

            <ExclusivePostsFeed
              posts={exclusivePosts}
              companyName={company.name}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 bg-white py-8 mt-20 text-center text-xs text-neutral-500 space-y-1">
        <p>© {new Date().getFullYear()} {company.name} • Todos los derechos reservados.</p>
        <p className="text-[11px] text-neutral-400">
          Powered by mankerz events • events.mankerz.xyz
        </p>
      </footer>
    </div>
  );
}

