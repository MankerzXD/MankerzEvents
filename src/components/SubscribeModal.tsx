'use client';

import { useState } from 'react';
import { subscribeToCompany } from '@/actions/subscriber-actions';

interface Props {
  companyId: string;
  companySlug: string;
  companyName: string;
  planTitle: string;
  price: number;
  perks: string;
}

export function SubscribeModal({
  companyId,
  companySlug,
  companyName,
  planTitle,
  price,
  perks,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('company_id', companyId);
    formData.append('company_slug', companySlug);
    formData.append('plan_tier', planTitle);
    formData.append('amount', String(price));

    try {
      const res = await subscribeToCompany(formData);
      if (res.success) {
        setSubscribed(true);
        form.reset();
      } else {
        setError(res.error || 'Ocurrió un error al procesar la suscripción.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          setIsOpen(true);
          setSubscribed(false);
          setError(null);
        }}
        className="px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900 cursor-pointer inline-flex items-center gap-2"
      >
        <span>☕ Suscribirme / Invitar Cafecito (${price} USD/mes)</span>
        <span>→</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Membresía Mensual / Cafecito
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  {planTitle} — {companyName}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 text-sm font-mono px-2 py-1"
              >
                ✕
              </button>
            </div>

            {subscribed ? (
              <div className="p-4 bg-neutral-50 border border-neutral-900 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    ¡Suscripción Confirmada!
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Muchas gracias por unirte al plan mensual de <strong className="text-neutral-900">{companyName}</strong>. Ahora tienes acceso a todo el contenido VIP y sorteos exclusivos.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800"
                  >
                    Acceder al Muro
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-300">
                    {error}
                  </p>
                )}

                <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-neutral-500">Aporte mensual:</span>
                    <strong className="text-base font-mono text-neutral-900">${price} USD</strong>
                  </div>
                  <p className="text-[11px] text-neutral-600 border-t border-neutral-200 pt-2">
                    ✓ {perks}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      placeholder="Ej. Lucas Barreto"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="lucas@email.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
                  <span className="text-[11px] text-neutral-400">
                    Cancela cuando quieras
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Confirmando...' : `Suscribirme por $${price}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
