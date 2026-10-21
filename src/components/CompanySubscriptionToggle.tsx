'use client';

import { useState } from 'react';
import { toggleCompanySubscriptions } from '@/actions/company-actions';

interface Props {
  companyId: string;
  initialEnabled: boolean;
  companyName: string;
}

export function CompanySubscriptionToggle({
  companyId,
  initialEnabled,
  companyName,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const nextState = !enabled;
    try {
      const res = await toggleCompanySubscriptions(companyId, nextState);
      if (res.success) {
        setEnabled(nextState);
      }
    } catch (err) {
      console.error('Failed to toggle subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
          enabled
            ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
            : 'bg-neutral-100 text-neutral-600 border-neutral-300'
        }`}
      >
        {enabled ? 'Suscripciones ON' : 'Solo Sorteos'}
      </span>

      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={enabled ? `Deshabilitar suscripciones para ${companyName}` : `Habilitar suscripciones estilo Cafecito para ${companyName}`}
        className="px-2 py-0.5 text-[10px] font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 disabled:opacity-50 cursor-pointer transition-colors"
      >
        {loading ? '...' : enabled ? 'Desactivar' : 'Habilitar'}
      </button>
    </div>
  );
}
