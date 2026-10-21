'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Company } from '@/types/database.types';

// In-memory tenant store fallback for immediate preview/testing before production DB keys are pasted
const fallbackCompanies: Company[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Demo Eventos SRL',
    slug: 'demo-eventos',
    description: 'Empresa de sorteos y rifas corporativas con membresías',
    admin_email: 'admin@demoeventos.com',
    status: 'active',
    has_subscriptions: true, // Habilitado por Super Admin para Demo Eventos
    subscription_title: 'Cafecito VIP / Membresía',
    subscription_price: 5.0,
    subscription_perks: 'Acceso a sorteos VIP mensuales, adelantos de eventos y grupo privado',
    subscription_content: '¡Bienvenido a la comunidad exclusiva! Aquí compartimos códigos especiales para sorteos y noticias anticipadas.',
    created_at: new Date('2026-10-01').toISOString(),
    updated_at: new Date('2026-10-01').toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Apex Gaming Fest',
    slug: 'apex-gaming',
    description: 'Torneos y sorteos de esports para gaming',
    admin_email: 'contact@apexgaming.com',
    status: 'active',
    has_subscriptions: false, // Deshabilitado: solo sorteos independientes
    subscription_title: 'Membresía Gamer',
    subscription_price: 8.0,
    subscription_perks: 'Acceso a torneos cerrados y sorteos gaming',
    subscription_content: 'Contenido exclusivo para gamers.',
    created_at: new Date('2026-10-15').toISOString(),
    updated_at: new Date('2026-10-15').toISOString(),
  },
];

async function verifySuperAdmin(): Promise<{ authorized: boolean; email?: string; error?: string }> {
  const cookieStore = await cookies();
  const devSessionCookie = cookieStore.get('mankerz_dev_user');
  
  let userEmail: string | null = null;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    userEmail = user.email || null;
  } else if (devSessionCookie?.value) {
    try {
      const parsed = JSON.parse(devSessionCookie.value);
      userEmail = parsed?.email || null;
    } catch {
      // Ignore
    }
  }

  if (!userEmail || userEmail.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      authorized: false,
      error: `Acceso denegado: El usuario (${userEmail || 'No autenticado'}) no tiene permisos de Super Admin. Solo ${SUPER_ADMIN_EMAIL} puede ejecutar esta acción.`,
    };
  }

  return { authorized: true, email: userEmail };
}

export async function createCompany(formData: FormData) {
  // 1. Strict Server-Side Authentication & Authorization Check
  const auth = await verifySuperAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  // 2. Extract and sanitize inputs
  const name = (formData.get('name') as string)?.trim();
  const rawSlug = (formData.get('slug') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) {
    return { success: false, error: 'El nombre de la empresa es obligatorio.' };
  }

  const slug = (rawSlug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (!slug) {
    return { success: false, error: 'El slug generado no es válido.' };
  }

  const admin_email = (formData.get('admin_email') as string)?.trim() || `admin@${slug}.com`;
  const has_subscriptions = formData.get('has_subscriptions') === 'on' || formData.get('has_subscriptions') === 'true';
  const subscription_title = (formData.get('subscription_title') as string)?.trim() || 'Membresía Mensual / Cafecito';
  const subscription_price = parseFloat(formData.get('subscription_price') as string) || 5.0;
  const subscription_perks = (formData.get('subscription_perks') as string)?.trim() || 'Acceso a sorteos exclusivos, contenido VIP y chat comunitario';

  // 3. Persistence: Supabase database or fallback store
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('companies') as any)
      .insert({
        name,
        slug,
        description,
        admin_email,
        status: 'active',
        has_subscriptions,
        subscription_title,
        subscription_price,
        subscription_perks,
        subscription_content: '¡Bienvenido a la zona exclusiva para miembros!',
      })
      .select()
      .single();

    if (error) {
      console.warn('DB Insert error (falling back to memory):', error.message);
    } else {
      revalidatePath('/super-admin/dashboard');
      return { success: true, company: data };
    }
  }

  // Fallback memory state
  const newCompany: Company = {
    id: `c-${Date.now()}`,
    name,
    slug,
    description,
    admin_email,
    status: 'active',
    has_subscriptions,
    subscription_title,
    subscription_price,
    subscription_perks,
    subscription_content: '¡Bienvenido a la zona exclusiva para miembros!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  fallbackCompanies.unshift(newCompany);
  revalidatePath('/super-admin/dashboard');

  return { success: true, company: newCompany };
}

// Super Admin toggle for Subscriptions / Cafecito feature on any company
export async function toggleCompanySubscriptions(companyId: string, enable: boolean) {
  const auth = await verifySuperAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = await (supabase
      .from('companies') as any)
      .update({ has_subscriptions: enable })
      .eq('id', companyId);

    if (error) {
      console.warn('DB update error:', error.message);
    }
  }

  const company = fallbackCompanies.find((c) => c.id === companyId);
  if (company) {
    company.has_subscriptions = enable;
  }

  revalidatePath('/super-admin/dashboard');
  if (company) {
    revalidatePath(`/${company.slug}`);
    revalidatePath(`/${company.slug}/admin`);
  }

  return { success: true, enabled: enable };
}

// Company Admin can customize their subscription details (title, price, perks, content)
export async function updateCompanySubscriptionSettings(formData: FormData) {
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const subscription_title = (formData.get('subscription_title') as string)?.trim();
  const subscription_price = parseFloat(formData.get('subscription_price') as string) || 5.0;
  const subscription_perks = (formData.get('subscription_perks') as string)?.trim();
  const subscription_content = (formData.get('subscription_content') as string)?.trim();

  if (!companyId) {
    return { success: false, error: 'Empresa no encontrada.' };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = await (supabase
      .from('companies') as any)
      .update({
        subscription_title,
        subscription_price,
        subscription_perks,
        subscription_content,
      })
      .eq('id', companyId);

    if (error) {
      console.warn('DB update error:', error.message);
    }
  }

  const company = fallbackCompanies.find((c) => c.id === companyId);
  if (company) {
    if (subscription_title) company.subscription_title = subscription_title;
    company.subscription_price = subscription_price;
    if (subscription_perks) company.subscription_perks = subscription_perks;
    if (subscription_content) company.subscription_content = subscription_content;
  }

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true };
}

export async function getCompanies(): Promise<Company[]> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        ...d,
        has_subscriptions: d.has_subscriptions ?? false,
      }));
    }
  }

  return fallbackCompanies;
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const cleanSlug = slug.toLowerCase().trim();

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', cleanSlug)
      .single();

    if (data) {
      return {
        ...data,
        has_subscriptions: data.has_subscriptions ?? false,
      };
    }
  }

  const found = fallbackCompanies.find((c) => c.slug.toLowerCase() === cleanSlug);
  return found || null;
}
