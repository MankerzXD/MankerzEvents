'use client';

import { useState } from 'react';
import { createSorteo } from '@/actions/sorteo-actions';

interface Props {
  companyId: string;
  companySlug: string;
}

export function CreateSorteoForm({ companyId, companySlug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('company_id', companyId);
    formData.append('company_slug', companySlug);

    try {
      const res = await createSorteo(formData);
      if (res.success && res.sorteo) {
        setMessage({
          type: 'success',
          text: `Sorteo "${res.sorteo.title}" creado exitosamente. Ya está disponible en la página pública.`,
        });
        form.reset();
        setIsOpen(false);
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Ocurrió un error al crear el sorteo.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Error de conexión con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-neutral-100 gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
            Creación y Configuración de Sorteos
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Genera nuevos sorteos con venta de números para los visitantes de tu página.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900 cursor-pointer"
        >
          {isOpen ? 'Cerrar Formulario' : '+ Crear Nuevo Sorteo'}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 text-xs border ${
            message.type === 'success'
              ? 'bg-neutral-50 border-neutral-900 text-neutral-900'
              : 'bg-red-50 border-red-400 text-red-900'
          }`}
        >
          {message.text}
        </div>
      )}

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 bg-neutral-50 border border-neutral-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Título del Sorteo *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ej. Gran Rifa iPhone 16 Pro Max 256GB"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Premio a Entregar *
              </label>
              <input
                type="text"
                name="prize"
                required
                placeholder="Ej. iPhone 16 Pro Max Nuevo Sellado"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Descripción y Bases del Sorteo
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="El sorteo se transmitirá en vivo cuando se complete el 100% de los números..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Precio por Número ($ USD) *
              </label>
              <input
                type="number"
                name="ticket_price"
                step="0.5"
                min="1"
                defaultValue={10}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Cantidad Total de Números *
              </label>
              <input
                type="number"
                name="total_tickets"
                min="10"
                defaultValue={100}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Fecha del Sorteo
              </label>
              <input
                type="date"
                name="draw_date"
                defaultValue={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
            <span className="text-[11px] text-neutral-500">
              Se publicará de inmediato en /{companySlug}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creando...' : 'Publicar Sorteo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
