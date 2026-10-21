'use client';

import { useState } from 'react';
import { updateCompanySubscriptionSettings } from '@/actions/company-actions';

interface Props {
  companyId: string;
  companySlug: string;
  initialTitle: string;
  initialPrice: number;
  initialPerks: string;
  initialContent: string;
}

export function CompanySubscriptionSettingsForm({
  companyId,
  companySlug,
  initialTitle,
  initialPrice,
  initialPerks,
  initialContent,
}: Props) {
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
      const res = await updateCompanySubscriptionSettings(formData);
      if (res.success) {
        setMessage({
          type: 'success',
          text: 'Configuración de membresías actualizada con éxito.',
        });
        setIsOpen(false);
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Error al guardar configuración.',
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
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              Módulo de Suscripciones (Estilo Cafecito / Membresías)
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Módulo habilitado por el Super Admin. Configura los beneficios y valor mensual de tu membresía.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-white hover:bg-neutral-100 text-neutral-900 transition-colors border border-neutral-300 cursor-pointer"
        >
          {isOpen ? 'Cerrar Ajustes' : 'Editar Configuración'}
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

      {isOpen ? (
        <form onSubmit={handleSubmit} className="p-4 bg-neutral-50 border border-neutral-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Título del Plan / Membresía *
              </label>
              <input
                type="text"
                name="subscription_title"
                defaultValue={initialTitle}
                required
                placeholder="Ej. Cafecito VIP / Membresía"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Precio Mensual ($ USD) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                name="subscription_price"
                defaultValue={initialPrice}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Beneficios para los Miembros
            </label>
            <textarea
              name="subscription_perks"
              rows={2}
              defaultValue={initialPerks}
              placeholder="Ej. Acceso a sorteos VIP mensuales, contenido anticipado y grupo privado..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Mensaje o Enlace de Bienvenida Exclusivo
            </label>
            <textarea
              name="subscription_content"
              rows={2}
              defaultValue={initialContent}
              placeholder="Ej. ¡Gracias por tu apoyo! Únete al canal de Telegram privado con este enlace..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] uppercase font-mono text-neutral-500 block">Plan</span>
            <span className="text-xs font-bold text-neutral-900">{initialTitle}</span>
          </div>
          <div className="p-3 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] uppercase font-mono text-neutral-500 block">Precio Mensual</span>
            <span className="text-xs font-bold font-mono text-neutral-900">${initialPrice} USD</span>
          </div>
          <div className="p-3 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] uppercase font-mono text-neutral-500 block">Beneficios</span>
            <span className="text-xs text-neutral-700 truncate block">{initialPerks}</span>
          </div>
        </div>
      )}
    </div>
  );
}
