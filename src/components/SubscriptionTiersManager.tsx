'use client';

import { useState } from 'react';
import {
  createSubscriptionTier,
  toggleSubscriptionTier,
  deleteSubscriptionTier,
  updateSubscriptionTier,
} from '@/actions/subscription-tier-actions';
import { MAX_ACTIVE_MEMBERSHIPS_LIMIT, MANKERZ_STUDIO_EMAIL } from '@/lib/constants';
import { SubscriptionTier } from '@/types/database.types';

interface Props {
  companyId: string;
  companySlug: string;
  companyName: string;
  initialTiers: SubscriptionTier[];
}

export function SubscriptionTiersManager({
  companyId,
  companySlug,
  companyName,
  initialTiers,
}: Props) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(initialTiers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const activeCount = tiers.filter((t) => t.is_active).length;
  const isLimitReached = activeCount >= MAX_ACTIVE_MEMBERSHIPS_LIMIT;

  async function handleCreateTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('company_id', companyId);
    formData.append('company_slug', companySlug);

    try {
      const res = await createSubscriptionTier(formData);
      if (res.success && res.tier) {
        setTiers([...tiers, res.tier]);
        setSuccessMsg(`Membresía "${res.tier.title}" creada con éxito.`);
        form.reset();
        setShowAddForm(false);
      } else {
        setError(res.error || 'Error al crear la membresía.');
      }
    } catch {
      setError('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTier) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('tier_id', editingTier.id);
    formData.append('company_id', companyId);
    formData.append('company_slug', companySlug);

    try {
      const res = await updateSubscriptionTier(formData);
      if (res.success && res.tier) {
        setTiers(tiers.map((t) => (t.id === res.tier.id ? res.tier : t)));
        setSuccessMsg(`Membresía "${res.tier.title}" actualizada con éxito.`);
        setEditingTier(null);
      } else {
        setError(res.error || 'Error al actualizar la membresía.');
      }
    } catch {
      setError('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(tier: SubscriptionTier) {
    setError(null);
    setSuccessMsg(null);

    if (!tier.is_active && isLimitReached) {
      setError(
        `Ya tienes ${MAX_ACTIVE_MEMBERSHIPS_LIMIT} membresías activas. Desactiva otra antes de activar esta, o ponte en contacto con mankerzStudio.`
      );
      return;
    }

    try {
      const res = await toggleSubscriptionTier(tier.id, companyId, companySlug);
      if (res.success) {
        setTiers(
          tiers.map((t) => (t.id === tier.id ? { ...t, is_active: !t.is_active } : t))
        );
      } else {
        setError(res.error || 'Error al cambiar estado.');
      }
    } catch {
      setError('Error al actualizar el estado de la membresía.');
    }
  }

  async function handleDelete(tierId: string) {
    if (!confirm('¿Estás seguro de eliminar este plan de membresía?')) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await deleteSubscriptionTier(tierId, companyId, companySlug);
      if (res.success) {
        setTiers(tiers.filter((t) => t.id !== tierId));
        setSuccessMsg('Membresía eliminada correctamente.');
      }
    } catch {
      setError('Error al eliminar membresía.');
    }
  }

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-6">
      {/* Header and Limit Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
              Niveles de Membresías y Cafecito
            </h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                isLimitReached
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-100 text-neutral-800 border-neutral-300'
              }`}
            >
              {activeCount} / {MAX_ACTIVE_MEMBERSHIPS_LIMIT} Activas
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Puedes configurar hasta 3 membresías activas simultáneas. Si necesitas más membresías, contacta a <strong className="text-neutral-800">mankerzStudio</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLimitReached ? (
            <button
              onClick={() => setShowContactModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 transition-colors cursor-pointer"
            >
              Contactar a mankerzStudio →
            </button>
          ) : (
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setError(null);
                setSuccessMsg(null);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900 cursor-pointer"
            >
              {showAddForm ? 'Cancelar' : '+ Agregar Membresía'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 text-xs bg-red-50 border border-red-300 text-red-800 flex items-start justify-between gap-2">
          <span>{error}</span>
          {isLimitReached && (
            <button
              onClick={() => setShowContactModal(true)}
              className="underline font-semibold ml-2 text-red-900 hover:no-underline"
            >
              Contactar a mankerzStudio
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3 text-xs bg-neutral-50 border border-neutral-900 text-neutral-900">
          {successMsg}
        </div>
      )}

      {/* Limit Reached Flat Callout Banner */}
      {isLimitReached && (
        <div className="p-4 bg-neutral-50 border-2 border-neutral-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-neutral-900"></span>
              Límite de {MAX_ACTIVE_MEMBERSHIPS_LIMIT} Membresías Activas Alcanzado
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              Cupo Estándar Completo
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Has configurado el máximo de <strong>3 planes de suscripción activos</strong> permitidos por defecto para tu empresa.
            Si tu comunidad requiere más niveles de suscripción, planes empresariales o funciones especiales, ponte en contacto directo con el equipo de <strong>mankerzStudio</strong> para ampliar la capacidad.
          </p>
          <div className="pt-1 flex items-center gap-3">
            <button
              onClick={() => setShowContactModal(true)}
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Contactar a mankerzStudio</span>
              <span className="font-mono">→</span>
            </button>
            <span className="text-[11px] text-neutral-500">
              O desactiva una membresía existente para agregar otra.
            </span>
          </div>
        </div>
      )}

      {/* Inline Form to Add Tier (When activeCount < 3) */}
      {showAddForm && !isLimitReached && (
        <form
          onSubmit={handleCreateTier}
          className="p-4 bg-neutral-50 border border-neutral-300 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Nueva Membresía para {companyName} ({activeCount + 1} de {MAX_ACTIVE_MEMBERSHIPS_LIMIT})
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              Queda {MAX_ACTIVE_MEMBERSHIPS_LIMIT - activeCount} disponible
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                Nombre del Plan / Nivel *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ej. Membresía Oro / Sponsor"
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
                name="price"
                required
                placeholder="Ej. 10.00"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Beneficios Incluidos
            </label>
            <textarea
              name="perks"
              rows={2}
              placeholder="Ej. Acceso a sorteos VIP mensuales, mención especial y canal privado..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creando...' : 'Crear Membresía'}
            </button>
          </div>
        </form>
      )}

      {/* Tiers List Table */}
      <div className="overflow-x-auto border border-neutral-200">
        <table className="w-full text-left text-xs bg-white">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700 border-b border-neutral-200">
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Plan / Nivel</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Precio</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Beneficios</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider">Estado</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-500">
                  No has registrado planes de membresía aún. Haz clic en &quot;+ Agregar Membresía&quot;.
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-neutral-900">
                    <div className="font-bold">{tier.title}</div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ID: {tier.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                    ${tier.price.toFixed(2)} USD
                  </td>
                  <td className="py-3 px-4 text-neutral-600 max-w-xs">
                    {tier.perks || 'Acceso general para miembros'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium border uppercase ${
                        tier.is_active
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tier.is_active ? 'bg-emerald-400' : 'bg-neutral-400'
                        }`}
                      ></span>
                      {tier.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingTier(tier);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(tier)}
                      className="px-2.5 py-1 text-[11px] font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
                    >
                      {tier.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(tier.id)}
                      className="px-2.5 py-1 text-[11px] font-medium text-red-700 hover:text-red-900 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-neutral-900 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Modificar Membresía
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  Editar {editingTier.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingTier(null)}
                className="text-neutral-400 hover:text-neutral-900 text-sm font-mono px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTier} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                  Nombre del Plan / Nivel *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingTier.title}
                  required
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
                  name="price"
                  defaultValue={editingTier.price}
                  required
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
                  Beneficios Incluidos
                </label>
                <textarea
                  name="perks"
                  rows={3}
                  defaultValue={editingTier.perks}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-3.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Contacting mankerzStudio */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-neutral-900 max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  Soporte y Expansión de Capacidad
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  Contactar a mankerzStudio
                </h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-neutral-400 hover:text-neutral-900 text-sm font-mono px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                Para ampliar el límite de membresías activas para <strong className="text-neutral-900">{companyName}</strong>, por favor ponte en contacto con el equipo de soporte de <strong>mankerzStudio</strong> indicando el slug de tu empresa.
              </p>
              <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-500">Empresa:</span>{' '}
                  <strong className="text-neutral-900">{companyName}</strong>
                </div>
                <div>
                  <span className="text-neutral-500">Slug:</span>{' '}
                  <span className="text-neutral-900">{companySlug}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Email Admin:</span>{' '}
                  <span className="text-neutral-900">admin@{companySlug}.com</span>
                </div>
                <div>
                  <span className="text-neutral-500">Canal directo:</span>{' '}
                  <a
                    href="mailto:studio@mankerz.xyz?subject=Solicitud%20de%20más%20membresías%20para%20empresa%20demo-eventos"
                    className="text-neutral-900 font-bold underline"
                  >
                    studio@mankerz.xyz
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-3.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
              >
                Cerrar
              </button>
              <a
                href={`mailto:studio@mankerz.xyz?subject=Solicitud%20de%20más%20membresías%20para%20${encodeURIComponent(companyName)}&body=Hola%20equipo%20de%20mankerzStudio,%0A%0ASolicito%20ampliar%20el%20límite%20de%203%20membresías%20activas%20para%20mi%20empresa:%0AEmpresa:%20${encodeURIComponent(companyName)}%0ASlug:%20${companySlug}%0A%0AGracias.`}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Enviar Email a mankerzStudio</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
