'use client';

import { useState } from 'react';
import { ExclusivePost } from '@/types/database.types';

interface Props {
  posts: ExclusivePost[];
  companyName: string;
}

export function ExclusivePostsFeed({ posts, companyName }: Props) {
  const [unlockedEmail, setUnlockedEmail] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputEmail, setInputEmail] = useState('');

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (inputEmail.trim()) {
      setUnlockedEmail(inputEmail.trim());
      setIsUnlocked(true);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-neutral-200 text-neutral-500 text-xs">
        El administrador aún no ha publicado contenido en el Muro VIP.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unlock bar */}
      <div className="p-3 bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-neutral-600">
          {isUnlocked ? (
            <span className="font-semibold text-neutral-900">
              ✓ Muro VIP Desbloqueado para {unlockedEmail}
            </span>
          ) : (
            <span>¿Ya eres miembro? Ingresa tu email para desbloquear el contenido VIP:</span>
          )}
        </span>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="flex items-center gap-2">
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              className="px-2.5 py-1 text-xs bg-neutral-50 border border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              Desbloquear
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsUnlocked(false)}
            className="text-[11px] text-neutral-500 underline hover:no-underline"
          >
            Bloquear vista
          </button>
        )}
      </div>

      {/* Posts Cards */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-neutral-200 p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-mono font-bold uppercase border border-neutral-300">
                VIP Post
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                {new Date(post.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>

            <h3 className="text-base font-bold text-neutral-900">
              {post.title}
            </h3>

            {isUnlocked ? (
              <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
                {post.content}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  {post.preview}
                </p>
                <div className="p-4 bg-neutral-50 border border-neutral-200 text-center space-y-1">
                  <p className="text-xs font-bold text-neutral-900">
                    🔒 Contenido bloqueado para miembros
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Suscríbete a {companyName} para leer este post completo y acceder a los beneficios.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
