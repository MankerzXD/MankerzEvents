'use client';

import { useState } from 'react';
import { createCompany } from '@/actions/company-actions';

export function CreateCompanyForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await createCompany(formData);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Empresa "${res.company?.name}" creada exitosamente con slug [${res.company?.slug}].`,
        });
        form.reset();
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Ocurrió un error inesperado al registrar la empresa.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al contactar el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 p-6">
      <div className="mb-5 pb-3 border-b border-neutral-100">
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
          Registrar Nueva Empresa (Tenant)
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Solo el Super Admin (<span className="font-mono text-neutral-800">sanchezmanuel397@gmail.com</span>) tiene autorización para ejecutar esta acción.
        </p>
      </div>

      {message && (
        <div
          className={`mb-5 p-3 text-xs border ${
            message.type === 'success'
              ? 'bg-neutral-50 border-neutral-900 text-neutral-900'
              : 'bg-red-50 border-red-500 text-red-900'
          }`}
        >
          {message.type === 'success' ? '✓ ' : '✕ '}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1"
            >
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Ej. Sorteos del Norte SRL"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1"
            >
              Slug Identificador (Opcional)
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              placeholder="ej. sorteos-norte"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 font-mono transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="admin_email"
              className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1"
            >
              Email del Administrador de la Empresa
            </label>
            <input
              type="email"
              id="admin_email"
              name="admin_email"
              placeholder="admin@empresa.com"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1"
            >
              Descripción / Rubro
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Sorteos en vivo y eventos corporativos"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
          <span className="text-[11px] text-neutral-400">
            Los datos se aíslan mediante RLS multi-tenant por company_id.
          </span>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors border border-neutral-900 cursor-pointer"
          >
            {loading ? 'Creando Empresa...' : 'Registrar Empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}
