'use client';

import { useState } from 'react';
import { addSubscriber } from '@/actions/subscriber-actions';
import { Subscription } from '@/types/database.types';

interface Props {
  companyId: string;
  companyName: string;
  initialSubscribers: Subscription[];
}

export function CompanySubscribersSection({
  companyId,
  companyName,
  initialSubscribers,
}: Props) {
  const [subscribers, setSubscribers] = useState<Subscription[]>(initialSubscribers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddSubscriber(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('company_id', companyId);

    try {
      const res = await addSubscriber(formData);
      if (res.success && res.subscription) {
        setSubscribers([res.subscription, ...subscribers]);
        form.reset();
        setShowAddForm(false);
      } else {
        setError(res.error || 'Error al agregar suscriptor.');
      }
    } catch {
      setError('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-6">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
            Listado de Suscriptores / Participantes
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Datos aislados exclusivamente para <span className="font-medium text-neutral-800">{companyName}</span> (Tenant: {companyId.slice(0, 8)}...).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900"
          >
            {showAddForm ? 'Cancelar' : '+ Agregar Suscriptor'}
          </button>
        </div>
      </div>

      {/* Quick Add Subscriber Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubscriber}
          className="p-4 bg-neutral-50 border border-neutral-200 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Nuevo Registro para {companyName}
            </span>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                placeholder="juan@ejemplo.com"
                className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-600 mb-1">
                Nivel / Plan
              </label>
              <select
                name="plan_tier"
                className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              >
                <option value="standard">Standard (Sorteo Regular)</option>
                <option value="vip">VIP (Acceso Preferente)</option>
                <option value="gold">Gold (Eventos Especiales)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Suscriptor'}
            </button>
          </div>
        </form>
      )}

      {/* Flat HTML Table */}
      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full text-left text-xs bg-white">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700 border-b border-neutral-200">
              <th className="py-3 px-4 font-semibold uppercase tracking-wider"># ID</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Suscriptor</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Correo Electrónico</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Nivel / Plan</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Fecha Registro</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {subscribers.length === 0 ? (
              // Empty State strictly formatted as requested
              <tr>
                <td
                  colSpan={6}
                  className="py-12 px-4 text-center text-neutral-500 bg-neutral-50/50"
                >
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-medium text-neutral-900 text-sm">
                      No hay suscriptores registrados en esta empresa
                    </p>
                    <p className="text-xs text-neutral-500">
                      El listado de suscriptores para <span className="text-neutral-700 font-medium">{companyName}</span> está vacío. Cuando nuevos usuarios participen en tus sorteos, se listarán automáticamente aquí.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-3 py-1.5 text-xs font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors"
                      >
                        Registrar Primer Suscriptor
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              subscribers.map((sub, idx) => (
                <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4 font-medium text-neutral-900">
                    {sub.full_name}
                  </td>
                  <td className="py-3 px-4 text-neutral-700 font-mono">
                    {sub.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-medium border border-neutral-300 bg-neutral-50 text-neutral-700">
                      {sub.plan_tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                    {new Date(sub.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium border border-neutral-300 text-neutral-800 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
        <span>Mostrando {subscribers.length} registros</span>
        <span className="font-mono">Filtro RLS: WHERE company_id = &apos;{companyId}&apos;</span>
      </div>
    </div>
  );
}
