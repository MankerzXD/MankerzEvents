'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Sorteo, Participacion } from '@/types/database.types';
import { getCompanies } from './company-actions';

// Fallback in-memory stores for instant testing without waiting for Supabase credentials
const fallbackSorteos: Sorteo[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    company_id: 'c1111111-1111-1111-1111-111111111111', // Demo Eventos SRL
    title: 'Gran Sorteo PlayStation 5 Slim + 2 Juegos',
    description: 'Participa por una consola PS5 Slim de 1TB edición digital con dos mandos DualSense y juegos a elección.',
    prize: 'PlayStation 5 Slim 1TB + 2 Mandos',
    ticket_price: 15.00,
    total_tickets: 200,
    sold_tickets: 42,
    draw_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    created_at: new Date('2026-10-18').toISOString(),
  },
];

const fallbackParticipaciones: Participacion[] = [
  {
    id: 'part-01',
    sorteo_id: 'a1111111-1111-1111-1111-111111111111',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    buyer_name: 'Carlos Mendoza',
    buyer_email: 'carlos.mendoza@email.com',
    buyer_phone: '+54 9 11 4455-6677',
    ticket_count: 3,
    total_amount: 45.00,
    ticket_numbers: [12, 45, 89],
    payment_status: 'completed',
    created_at: new Date('2026-10-19').toISOString(),
  },
  {
    id: 'part-02',
    sorteo_id: 'a1111111-1111-1111-1111-111111111111',
    company_id: 'c1111111-1111-1111-1111-111111111111',
    buyer_name: 'Mariana Ríos',
    buyer_email: 'mariana.rios@email.com',
    buyer_phone: '+54 9 11 7788-9900',
    ticket_count: 2,
    total_amount: 30.00,
    ticket_numbers: [104, 155],
    payment_status: 'completed',
    created_at: new Date('2026-10-20').toISOString(),
  },
];

// Helper to verify if caller is authorized admin of this company
async function verifyCompanyAdmin(companyId: string): Promise<{ authorized: boolean; email?: string; error?: string }> {
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

  if (!userEmail) {
    return { authorized: false, error: 'Debes iniciar sesión para realizar esta acción.' };
  }

  // Super Admin always has master authorization
  if (userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { authorized: true, email: userEmail };
  }

  // Find company to check admin_email
  const companies = await getCompanies();
  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return { authorized: false, error: 'Empresa no encontrada.' };
  }

  if (company.admin_email?.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      authorized: false,
      error: `Acceso denegado: Tu email (${userEmail}) no es el administrador registrado (${company.admin_email}) de esta empresa.`,
    };
  }

  return { authorized: true, email: userEmail };
}

export async function createSorteo(formData: FormData) {
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const prize = (formData.get('prize') as string)?.trim();
  const ticket_price = parseFloat(formData.get('ticket_price') as string) || 10.0;
  const total_tickets = parseInt(formData.get('total_tickets') as string, 10) || 100;
  const draw_date = (formData.get('draw_date') as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (!companyId || !title || !prize) {
    return { success: false, error: 'Título, premio y empresa son campos obligatorios.' };
  }

  // RBAC GUARD: Only registered company admin or super admin
  const authCheck = await verifyCompanyAdmin(companyId);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('sorteos') as any)
      .insert({
        company_id: companyId,
        title,
        description,
        prize,
        ticket_price,
        total_tickets,
        sold_tickets: 0,
        draw_date,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (companySlug) {
      revalidatePath(`/${companySlug}`);
      revalidatePath(`/${companySlug}/admin`);
    }
    return { success: true, sorteo: data };
  }

  const newSorteo: Sorteo = {
    id: `sorteo-${Date.now()}`,
    company_id: companyId,
    title,
    description,
    prize,
    ticket_price,
    total_tickets,
    sold_tickets: 0,
    draw_date,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  fallbackSorteos.unshift(newSorteo);

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true, sorteo: newSorteo };
}

export async function getSorteosByCompanyId(companyId: string): Promise<Sorteo[]> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('sorteos')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data as Sorteo[];
    }
  }

  return fallbackSorteos.filter((s) => s.company_id === companyId);
}

export async function buyParticipation(formData: FormData) {
  const sorteoId = formData.get('sorteo_id') as string;
  const companyId = formData.get('company_id') as string;
  const companySlug = formData.get('company_slug') as string;
  const buyer_name = (formData.get('buyer_name') as string)?.trim();
  const buyer_email = (formData.get('buyer_email') as string)?.trim();
  const buyer_phone = (formData.get('buyer_phone') as string)?.trim();
  const ticket_count = parseInt(formData.get('ticket_count') as string, 10) || 1;

  if (!sorteoId || !companyId || !buyer_name || !buyer_email || !buyer_phone) {
    return { success: false, error: 'Por favor completa todos tus datos personales.' };
  }

  // Find the raffle to compute pricing and numbers
  const sorteo = fallbackSorteos.find((s) => s.id === sorteoId);
  const ticketPrice = sorteo ? sorteo.ticket_price : 10;
  const totalAmount = ticketPrice * ticket_count;

  // Generate assigned ticket numbers
  const currentSold = sorteo ? sorteo.sold_tickets : 10;
  const assignedNumbers: number[] = [];
  for (let i = 1; i <= ticket_count; i++) {
    assignedNumbers.push(currentSold + i);
  }

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await (supabase
      .from('participaciones') as any)
      .insert({
        sorteo_id: sorteoId,
        company_id: companyId,
        buyer_name,
        buyer_email,
        buyer_phone,
        ticket_count,
        total_amount: totalAmount,
        ticket_numbers: assignedNumbers,
        payment_status: 'completed',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (companySlug) {
      revalidatePath(`/${companySlug}`);
      revalidatePath(`/${companySlug}/admin`);
    }

    return { success: true, participacion: data, numbers: assignedNumbers };
  }

  // Fallback update
  if (sorteo) {
    sorteo.sold_tickets += ticket_count;
  }

  const newPart: Participacion = {
    id: `part-${Date.now()}`,
    sorteo_id: sorteoId,
    company_id: companyId,
    buyer_name,
    buyer_email,
    buyer_phone,
    ticket_count,
    total_amount: totalAmount,
    ticket_numbers: assignedNumbers,
    payment_status: 'completed',
    created_at: new Date().toISOString(),
  };

  fallbackParticipaciones.unshift(newPart);

  if (companySlug) {
    revalidatePath(`/${companySlug}`);
    revalidatePath(`/${companySlug}/admin`);
  }

  return { success: true, participacion: newPart, numbers: assignedNumbers };
}

export async function getParticipacionesByCompanyId(companyId: string): Promise<Participacion[]> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('participaciones')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (data) {
      return data as Participacion[];
    }
  }

  return fallbackParticipaciones.filter((p) => p.company_id === companyId);
}
