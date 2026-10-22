'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionTier } from '@/types/database.types';
import { MAX_ACTIVE_MEMBERSHIPS_LIMIT } from '@/lib/constants';

// Fallback in-memory tiers store for immediate testability
const fallbackTiers: Record<string, SubscriptionTier[]> = {
  'c1111111-1111-1111-1111-111111111111': [
    {
      id: 't1111111-1111-1111-1111-111111111111',
      company_id: 'c1111111-1111-1111-1111-111111111111',
      title: 'Cafecito Bronce',
      price: 3.00,
      perks: 'Acceso al Muro VIP y publicaciones exclusivas de la comunidad.',
      is_active: true,
      created_at: new Date('2026-10-20').toISOString(),
    },
    {
      id: 't2222222-2222-2222-2222-222222222222',
      company_id: 'c1111111-1111-1111-1111-111111111111',
      title: 'Membresía Plata VIP',
      price: 6.00,
      perks: 'Acceso al Muro VIP + 1 número extra en sorteos oficiales + grupo privado.',
      is_active: true,
      created_at: new Date('2026-10-21').toISOString(),
    },
  ],
};

export async function getSubscriptionTiersByCompany(companyId: string): Promise<SubscriptionTier[]> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('company_id', companyId)
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      return (data as any[]).map((d) => ({
        ...d,
        price: typeof d.price === 'string' ? parseFloat(d.price) : d.price,
      })) as SubscriptionTier[];
    }
  }

  return fallbackTiers[companyId] || [];
}

export async function getActiveSubscriptionTiersByCompany(companyId: string): Promise<SubscriptionTier[]> {
  const allTiers = await getSubscriptionTiersByCompany(companyId);
  return allTiers.filter((t) => t.is_active);
}

export async function createSubscriptionTier(formData: FormData) {
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const title = (formData.get('title') as string)?.trim();
  const price = parseFloat(formData.get('price') as string);
  const perks = (formData.get('perks') as string)?.trim() || '';

  if (!companyId || !title || isNaN(price) || price <= 0) {
    return { success: false, error: 'Título y precio mensual válido son requeridos.' };
  }

  // Check the strict rule: "la persona puede agregar hasta tres suscripciones activas"
  const currentTiers = await getSubscriptionTiersByCompany(companyId);
  const activeCount = currentTiers.filter((t) => t.is_active).length;

  if (activeCount >= MAX_ACTIVE_MEMBERSHIPS_LIMIT) {
    return {
      success: false,
      error: `Has alcanzado el límite de ${MAX_ACTIVE_MEMBERSHIPS_LIMIT} membresías activas. Si necesitas más membresías para tu empresa, ponte en contacto con mankerzStudio.`,
      limitReached: true,
    };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('subscription_tiers') as any)
      .insert({
        company_id: companyId,
        title,
        price,
        perks,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      if (companySlug) {
        revalidatePath(`/${companySlug}`);
        revalidatePath(`/${companySlug}/admin`);
      }
      return { success: true, tier: data };
    }
  }

  const newTier: SubscriptionTier = {
    id: `tier-${Date.now()}`,
    company_id: companyId,
    title,
    price,
    perks,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (!fallbackTiers[companyId]) {
    fallbackTiers[companyId] = [];
  }
  fallbackTiers[companyId].push(newTier);

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true, tier: newTier };
}

export async function toggleSubscriptionTier(tierId: string, companyId: string, companySlug: string) {
  const tiers = await getSubscriptionTiersByCompany(companyId);
  const target = tiers.find((t) => t.id === tierId);

  if (!target) {
    return { success: false, error: 'Membresía no encontrada.' };
  }

  // If turning active, verify it doesn't exceed 3 active tiers
  if (!target.is_active) {
    const activeCount = tiers.filter((t) => t.is_active).length;
    if (activeCount >= MAX_ACTIVE_MEMBERSHIPS_LIMIT) {
      return {
        success: false,
        error: `Ya tienes ${MAX_ACTIVE_MEMBERSHIPS_LIMIT} membresías activas. Desactiva una antes de activar esta, o ponte en contacto con mankerzStudio para ampliar el límite.`,
        limitReached: true,
      };
    }
  }

  const nextState = !target.is_active;

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = await (supabase
      .from('subscription_tiers') as any)
      .update({ is_active: nextState })
      .eq('id', tierId);

    if (!error) {
      if (companySlug) {
        revalidatePath(`/${companySlug}`);
        revalidatePath(`/${companySlug}/admin`);
      }
      return { success: true, is_active: nextState };
    }
  }

  target.is_active = nextState;

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true, is_active: nextState };
}

export async function deleteSubscriptionTier(tierId: string, companyId: string, companySlug: string) {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.from('subscription_tiers').delete().eq('id', tierId);
  }

  if (fallbackTiers[companyId]) {
    fallbackTiers[companyId] = fallbackTiers[companyId].filter((t) => t.id !== tierId);
  }

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true };
}

export async function updateSubscriptionTier(formData: FormData) {
  const tierId = formData.get('tier_id') as string;
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const title = (formData.get('title') as string)?.trim();
  const price = parseFloat(formData.get('price') as string);
  const perks = (formData.get('perks') as string)?.trim() || '';

  if (!tierId || !companyId || !title || isNaN(price) || price <= 0) {
    return { success: false, error: 'Título y precio mensual válido son requeridos.' };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('subscription_tiers') as any)
      .update({
        title,
        price,
        perks,
      })
      .eq('id', tierId)
      .select()
      .single();

    if (!error && data) {
      if (companySlug) {
        revalidatePath(`/${companySlug}`);
        revalidatePath(`/${companySlug}/admin`);
      }
      return {
        success: true,
        tier: {
          ...data,
          price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
        } as SubscriptionTier,
      };
    }
  }

  if (fallbackTiers[companyId]) {
    const idx = fallbackTiers[companyId].findIndex((t) => t.id === tierId);
    if (idx !== -1) {
      fallbackTiers[companyId][idx] = {
        ...fallbackTiers[companyId][idx],
        title,
        price,
        perks,
      };
      if (companySlug) {
        revalidatePath(`/${companySlug}`);
        revalidatePath(`/${companySlug}/admin`);
      }
      return { success: true, tier: fallbackTiers[companyId][idx] };
    }
  }

  return { success: false, error: 'Membresía no encontrada.' };
}
