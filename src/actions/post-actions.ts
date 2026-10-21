'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ExclusivePost } from '@/types/database.types';

const fallbackPosts: ExclusivePost[] = [
  {
    id: 'post-01',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    title: 'Bases y Fechas del Gran Sorteo Aniversario',
    preview: 'Publicación exclusiva para miembros activos sobre el cronograma del sorteo y cupos...',
    content: '¡Hola miembros! Como suscriptores VIP activos, tienen 1 número gratis reservado para el sorteo del mes que viene. Estén atentos al enlace de confirmación privada que publicaremos aquí.',
    created_at: new Date('2026-10-20').toISOString(),
  },
  {
    id: 'post-02',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    title: 'Detrás de Escena: Organización del Próximo Evento',
    preview: 'Un adelanto de cómo preparamos las transmisiones y los premios especiales...',
    content: 'Queremos agradecerles por apoyar el proyecto con sus membresías. Gracias a ustedes pudimos adquirir mejores equipos de transmisión y agregar un premio secundario sorpresa.',
    created_at: new Date('2026-10-21').toISOString(),
  },
];

export async function getExclusivePosts(companyId: string): Promise<ExclusivePost[]> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exclusive_posts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data as ExclusivePost[];
    }
  }

  return fallbackPosts.filter((p) => p.company_id === companyId);
}

export async function createExclusivePost(formData: FormData) {
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const title = (formData.get('title') as string)?.trim();
  const preview = (formData.get('preview') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();

  if (!companyId || !title || !content) {
    return { success: false, error: 'Título y contenido son obligatorios.' };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('exclusive_posts') as any)
      .insert({
        company_id: companyId,
        title,
        preview: preview || title.slice(0, 100),
        content,
      })
      .select()
      .single();

    if (!error && data) {
      if (companySlug) {
        revalidatePath(`/${companySlug}`);
        revalidatePath(`/${companySlug}/admin`);
      }
      return { success: true, post: data };
    }
  }

  const newPost: ExclusivePost = {
    id: `post-${Date.now()}`,
    company_id: companyId,
    title,
    preview: preview || title.slice(0, 100),
    content,
    created_at: new Date().toISOString(),
  };

  fallbackPosts.unshift(newPost);

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true, post: newPost };
}
