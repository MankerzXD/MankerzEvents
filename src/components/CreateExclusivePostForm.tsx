'use client';

import { useState } from 'react';
import { createExclusivePost } from '@/actions/post-actions';

interface Props {
  companyId: string;
  companySlug: string;
}

export function CreateExclusivePostForm({ companyId, companySlug }: Props) {
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
      const res = await createExclusivePost(formData);
      if (res.success && res.post) {
        setMessage({
          type: 'success',
          text: `Publicación "${res.post.title}" creada y protegida para miembros.`,
        });
        form.reset();
        setIsOpen(false);
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Error al publicar contenido.',
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
            Contenido Exclusivo para Miembros (Muro VIP)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Publica adelantos, anuncios VIP o enlaces privados visibles únicamente para tus suscriptores.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900 cursor-pointer"
        >
          {isOpen ? 'Cerrar' : '+ Publicar Contenido VIP'}
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
          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Título de la Publicación *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Ej. Fechas del próximo sorteo VIP y código especial"
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Vista Previa Pública (Visible para todos)
            </label>
            <input
              type="text"
              name="preview"
              placeholder="Ej. Un resumen breve para motivar a suscribirse..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase text-neutral-700 mb-1">
              Contenido Completo (Solo visible para suscriptores) *
            </label>
            <textarea
              name="content"
              rows={4}
              required
              placeholder="Escribe aquí el contenido secreto, noticias, enlaces de descarga o enlaces privados para miembros..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
            <span className="text-[11px] text-neutral-500">
              Aparecerá bloqueado para el público y desbloqueado para miembros en /{companySlug}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Publicando...' : 'Publicar en Muro VIP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
