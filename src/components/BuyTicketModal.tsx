'use client';

import { useState } from 'react';
import { buyParticipation } from '@/actions/sorteo-actions';
import { Sorteo } from '@/types/database.types';

interface Props {
  sorteo: Sorteo;
  companyId: string;
  companySlug: string;
}

export function BuyTicketModal({ sorteo, companyId, companySlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ numbers: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCost = (ticketCount * sorteo.ticket_price).toFixed(2);
  const availableTickets = Math.max(0, sorteo.total_tickets - sorteo.sold_tickets);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('sorteo_id', sorteo.id);
    formData.append('company_id', companyId);
    formData.append('company_slug', companySlug);

    try {
      const res = await buyParticipation(formData);
      if (res.success && res.numbers) {
        setSuccessData({ numbers: res.numbers });
        form.reset();
      } else {
        setError(res.error || 'No se pudo procesar la compra.');
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
          setSuccessData(null);
          setError(null);
        }}
        disabled={availableTickets <= 0}
        className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors border border-neutral-900 cursor-pointer text-center"
      >
        {availableTickets > 0 ? 'Comprar Participación →' : 'Números Agotados'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Participación en Sorteo
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  {sorteo.title}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 text-sm font-mono px-2 py-1"
              >
                ✕ Cerrar
              </button>
            </div>

            {successData ? (
              <div className="p-4 bg-neutral-50 border border-neutral-900 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    ¡Compra Confirmada con Éxito!
                  </p>
                </div>
                <p className="text-xs text-neutral-600">
                  Tus números asignados para el sorteo del premio <strong className="text-neutral-900">{sorteo.prize}</strong> son:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {successData.numbers.map((num) => (
                    <span
                      key={num}
                      className="px-2.5 py-1 bg-neutral-900 text-white text-xs font-mono font-bold"
                    >
                      #{String(num).padStart(3, '0')}
                    </span>
                  ))}
                </div>
                <div className="pt-3 border-t border-neutral-200 flex justify-end">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800"
                  >
                    Entendido
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

                <div className="p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Premio Principal:</span>
                    <strong className="text-neutral-900">{sorteo.prize}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 block text-[11px]">Precio por Número:</span>
                    <strong className="text-neutral-900 font-mono">${sorteo.ticket_price} USD</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      name="buyer_name"
                      required
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="buyer_email"
                      required
                      placeholder="juan@email.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="buyer_phone"
                      required
                      placeholder="+54 9 11 1234-5678"
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium uppercase text-neutral-600">
                      Cantidad de Participaciones (Números)
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Disponibles: {availableTickets}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="ticket_count"
                      min={1}
                      max={availableTickets}
                      value={ticketCount}
                      onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <div className="flex-1 p-2 bg-neutral-100 text-right font-mono text-xs text-neutral-800 border border-neutral-300">
                      Total a Pagar: <strong className="text-neutral-900">${totalCost} USD</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
                  <span className="text-[11px] text-neutral-500">
                    Números asignados automáticamente
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Procesando...' : `Confirmar y Pagar $${totalCost}`}
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
