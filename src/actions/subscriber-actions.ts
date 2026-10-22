'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Subscription } from '@/types/database.types';

// In-memory subscriber store fallback for instant tenant isolation testing
const fallbackSubscriptions: Record<string, Subscription[]> = {
  'c1111111-1111-1111-1111-111111111111': [
    {
      id: 'sub-01',
      company_id: 'c1111111-1111-1111-1111-111111111111',
      email: 'lucas.vip@gmail.com',
      full_name: 'Lucas Barreto',
      plan_tier: 'Cafecito VIP',
      amount: 5.00,
      status: 'active',
      created_at: new Date('2026-10-19').toISOString(),
      updated_at: new Date('2026-10-19').toISOString(),
    },
    {
      id: 'sub-02',
      company_id: 'c1111111-1111-1111-1111-111111111111',
      email: 'sofia.fan@gmail.com',
      full_name: 'Sofía Navarro',
      plan_tier: 'Cafecito VIP',
      amount: 5.00,
      status: 'active',
      created_at: new Date('2026-10-21').toISOString(),
      updated_at: new Date('2026-10-21').toISOString(),
    },
  ],
};

export async function getSubscribersByCompany(companyId: string): Promise<Subscription[]> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        ...d,
        amount: d.amount ? parseFloat(d.amount) : 5.00,
      }));
    }
  }

  return fallbackSubscriptions[companyId] || [];
}

export async function subscribeToCompany(formData: FormData) {
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const email = (formData.get('email') as string)?.trim();
  const full_name = (formData.get('full_name') as string)?.trim();
  const plan_tier = (formData.get('plan_tier') as string)?.trim() || 'Cafecito Mensual';
  const amount = parseFloat(formData.get('amount') as string) || 5.00;

  if (!companyId || !email || !full_name) {
    return { success: false, error: 'Nombre y correo electrónico son requeridos para suscribirte.' };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('subscriptions') as any)
      .insert({
        company_id: companyId,
        email,
        full_name,
        plan_tier,
        amount,
        status: 'active',
      })
      .select()
      .single();

    if (!error && data) {
      if (companySlug) {
        revalidatePath(`/${companySlug}`);
        revalidatePath(`/${companySlug}/admin`);
      }
      revalidatePath('/dashboard');
      return { success: true, subscription: data };
    }
  }

  const newSub: Subscription = {
    id: `sub-${Date.now()}`,
    company_id: companyId,
    email,
    full_name,
    plan_tier,
    amount,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!fallbackSubscriptions[companyId]) {
    fallbackSubscriptions[companyId] = [];
  }
  fallbackSubscriptions[companyId].unshift(newSub);

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }
  revalidatePath('/dashboard');

  return { success: true, subscription: newSub };
}

export async function addSubscriber(formData: FormData) {
  return subscribeToCompany(formData);
}

export async function deleteSubscriber(subscriberId: string, companyId: string, companySlug: string) {
  if (!subscriberId || !companyId) {
    return { success: false, error: 'ID de suscriptor y empresa son requeridos.' };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriberId)
      .eq('company_id', companyId);
  }

  if (fallbackSubscriptions[companyId]) {
    fallbackSubscriptions[companyId] = fallbackSubscriptions[companyId].filter(
      (s) => s.id !== subscriberId
    );
  }

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }
  revalidatePath('/dashboard');

  return { success: true };
}
