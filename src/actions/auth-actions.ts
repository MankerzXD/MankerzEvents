'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SUPER_ADMIN_EMAIL, USER_ROLES } from '@/lib/constants';

export async function loginWithEmail(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const returnUrl = (formData.get('returnUrl') as string) || '';

  if (!email) {
    return;
  }

  const supabase = await createClient();
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured && password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error.message);
      return;
    }
  } else {
    // Development / MVP direct session cookie
    const cookieStore = await cookies();
    const role =
      email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        ? USER_ROLES.SUPER_ADMIN
        : email.toLowerCase().includes('demoeventos') || email.toLowerCase().includes('admin')
        ? USER_ROLES.COMPANY_ADMIN
        : USER_ROLES.SUBSCRIBER;

    cookieStore.set(
      'mankerz_dev_user',
      JSON.stringify({
        email,
        role,
        company_id:
          role === USER_ROLES.COMPANY_ADMIN
            ? 'c1111111-1111-1111-1111-111111111111'
            : null,
      }),
      { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' }
    );
  }

  if (returnUrl) {
    redirect(returnUrl);
  }

  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    redirect('/super-admin/dashboard');
  }

  redirect('/dashboard');
}

export async function setDevRole(roleType: 'super_admin' | 'company_admin' | 'subscriber') {
  const cookieStore = await cookies();

  if (roleType === 'super_admin') {
    cookieStore.set(
      'mankerz_dev_user',
      JSON.stringify({
        email: SUPER_ADMIN_EMAIL,
        role: USER_ROLES.SUPER_ADMIN,
        full_name: 'Manuel Sánchez (Super Admin)',
        company_id: null,
      }),
      { path: '/', httpOnly: true }
    );
    redirect('/super-admin/dashboard');
  } else if (roleType === 'company_admin') {
    cookieStore.set(
      'mankerz_dev_user',
      JSON.stringify({
        email: 'admin@demoeventos.com',
        role: USER_ROLES.COMPANY_ADMIN,
        full_name: 'Admin (Demo Eventos SRL)',
        company_id: 'c1111111-1111-1111-1111-111111111111',
      }),
      { path: '/', httpOnly: true }
    );
    redirect('/demo-eventos/admin');
  } else {
    cookieStore.set(
      'mankerz_dev_user',
      JSON.stringify({
        email: 'suscriptor@gmail.com',
        role: USER_ROLES.SUBSCRIBER,
        full_name: 'Participante General',
        company_id: 'c1111111-1111-1111-1111-111111111111',
      }),
      { path: '/', httpOnly: true }
    );
    redirect('/dashboard');
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete('mankerz_dev_user');

  redirect('/login');
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const devSessionCookie = cookieStore.get('mankerz_dev_user');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const isSuper = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    return {
      email: user.email,
      role: isSuper ? USER_ROLES.SUPER_ADMIN : (user.user_metadata?.role || USER_ROLES.SUBSCRIBER),
      company_id: user.user_metadata?.company_id || null,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      isSuperAdmin: isSuper,
    };
  }

  if (devSessionCookie?.value) {
    try {
      const parsed = JSON.parse(devSessionCookie.value);
      return {
        ...parsed,
        isSuperAdmin: parsed.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
      };
    } catch {
      return null;
    }
  }

  return null;
}
