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
    description: 'Empresa de sorteos y rifas corporativas',
    admin_email: 'admin@demoeventos.com',
    status: 'active',
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
    created_at: new Date('2026-10-15').toISOString(),
    updated_at: new Date('2026-10-15').toISOString(),
  },
];

export async function createCompany(formData: FormData) {
  // 1. Strict Server-Side Authentication & Authorization Check
  const cookieStore = await cookies();
  const devSessionCookie = cookieStore.get('mankerz_dev_user');
  
  let userEmail: string | null = null;
  const supabase = await createClient();

  // Try real Supabase auth
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

  // 2. STRICT GUARD: Verify email is sanchezmanuel397@gmail.com
  if (!userEmail || userEmail.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      error: `Acceso denegado: El usuario (${userEmail || 'No autenticado'}) no tiene permisos de Super Admin. Solo ${SUPER_ADMIN_EMAIL} puede crear empresas.`,
    };
  }

  // 3. Extract and sanitize inputs
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

  // 4. Persistence: Supabase database or fallback store
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder');

  if (isSupabaseConfigured) {
    const { data, error } = await (supabase
      .from('companies') as any)
      .insert({
        name,
        slug,
        description,
        admin_email,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Error al crear empresa en Base de Datos: ${error.message}`,
      };
    }

    revalidatePath('/super-admin/dashboard');
    return { success: true, company: data };
  }

  // Fallback memory state for instant testing
  const newCompany: Company = {
    id: `c-${Date.now()}`,
    name,
    slug,
    description,
    admin_email,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  fallbackCompanies.unshift(newCompany);
  revalidatePath('/super-admin/dashboard');

  return { success: true, company: newCompany };
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
      return data;
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
      return data;
    }
  }

  const found = fallbackCompanies.find((c) => c.slug.toLowerCase() === cleanSlug);
  return found || null;
}

