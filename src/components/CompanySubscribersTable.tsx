'use client';

import { useState } from 'react';
import { deleteSubscriber } from '@/actions/subscriber-actions';
import { Subscription } from '@/types/database.types';

interface Props {
  companyId: string;
  companySlug: string;
  companyName: string;
  initialSubscribers: Subscription[];
}

export function CompanySubscribersTable({
  companyId,
  companySlug,
  companyName,
  initialSubscribers,
}: Props) {
  const [subscribers, setSubscribers] = useState<Subscription[]>(initialSubscribers);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = subscribers.filter((sub) => {
    const term = search.toLowerCase();
    return (
      sub.full_name?.toLowerCase().includes(term) ||
      sub.email?.toLowerCase().includes(term) ||
      sub.plan_tier?.toLowerCase().includes(term)
    );
  });

  const totalMRR = subscribers
    .filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + (s.amount || 0), 0);

  async function handleDeleteSubscriber(sub: Subscription) {
    const confirmed = confirm(
      `¿Confirmas que deseas eliminar al usuario "${sub.full_name}" (${sub.email}) de la lista de miembros?`
    );
    if (!confirmed) return;

    setDeletingId(sub.id);
    setFeedback(null);

    try {
      const res = await deleteSubscriber(sub.id, companyId, companySlug);
      if (res.success) {
        setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
        setFeedback({
          type: 'success',
          text: `Usuario "${sub.full_name}" eliminado correctamente de ${companyName}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Error al eliminar el suscriptor.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Error de conexión con el servidor al intentar eliminar.',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4">
      {/* Header and Live MRR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-neutral-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
              Suscriptores y Miembros Mensuales ({subscribers.length})
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono border border-neutral-300 bg-neutral-50 text-neutral-700">
              Gestión de Usuarios
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Comunidad activa que apoya a {companyName}. Puedes revocar o eliminar cualquier usuario cuando lo desees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              MRR Activo
            </span>
            <span className="text-sm font-mono font-bold text-neutral-900">
              ${totalMRR.toFixed(2)} USD/mes
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3 text-xs border ${
            feedback.type === 'success'
              ? 'bg-neutral-50 border-neutral-900 text-neutral-900'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, correo electrónico o nivel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-neutral-500 hover:text-neutral-900 underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full text-left text-xs bg-white">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Miembro</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Email</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Plan / Nivel</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Aporte Mensual</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Fecha Alta</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Estado</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-500">
                  {search
                    ? `No se encontraron usuarios coincidentes con "${search}".`
                    : 'Aún no hay suscriptores registrados para esta empresa.'}
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-neutral-900">
                    {sub.full_name || 'Miembro'}
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-600">
                    {sub.email}
                  </td>
                  <td className="py-3 px-4 text-neutral-800">
                    <span className="font-medium">{sub.plan_tier}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                    ${sub.amount?.toFixed(2) || '5.00'} USD
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                    {new Date(sub.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border border-neutral-300 text-neutral-800 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSubscriber(sub)}
                      disabled={deletingId === sub.id}
                      className="px-2.5 py-1 text-[11px] font-medium text-red-700 hover:text-red-900 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                      title="Eliminar usuario de las membresías"
                    >
                      {deletingId === sub.id ? 'Eliminando...' : 'Eliminar Usuario'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
