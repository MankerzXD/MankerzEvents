'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Subscription } from '@/types/database.types';

// In-memory subscriber store fallback for instant tenant isolation testing
const fallbackSubscriptions: Record<string, Subscription[]> = {
  // Empty by default for demo company as requested
  'c1111111-1111-1111-1111-111111111111': [],
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

    if (!error && data) {
      return data;
    }
  }

  return fallbackSubscriptions[companyId] || [];
}

export async function addSubscriber(formData: FormData) {
  const companyId = formData.get('company_id') as string;
  const email = (formData.get('email') as string)?.trim();
  const full_name = (formData.get('full_name') as string)?.trim();
  const plan_tier = (formData.get('plan_tier') as string)?.trim() || 'standard';

  if (!companyId || !email || !full_name) {
    return { success: false, error: 'Email, nombre y empresa son requeridos.' };
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
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, subscriber: data };
  }

  const newSub: Subscription = {
    id: `sub-${Date.now()}`,
    company_id: companyId,
    email,
    full_name,
    plan_tier,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!fallbackSubscriptions[companyId]) {
    fallbackSubscriptions[companyId] = [];
  }
  fallbackSubscriptions[companyId].unshift(newSub);

  revalidatePath('/dashboard');
  return { success: true, subscriber: newSub };
}
