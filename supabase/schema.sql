-- ==============================================================================
-- MANKERZ EVENTS - MULTI-TENANT SAAS DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'subscriber');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. COMPANIES TABLE (Tenants)
-- Cada empresa tiene su propio /{slug} y /{slug}/admin
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    admin_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROFILES TABLE (Linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'subscriber',
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. SORTEOS TABLE (Sorteos generados por el admin de cada empresa)
CREATE TABLE IF NOT EXISTS public.sorteos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    prize TEXT NOT NULL,
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    total_tickets INT NOT NULL DEFAULT 100,
    sold_tickets INT NOT NULL DEFAULT 0,
    draw_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PARTICIPACIONES TABLE (Venta de tickets por cada sorteo)
CREATE TABLE IF NOT EXISTS public.participaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sorteo_id UUID NOT NULL REFERENCES public.sorteos(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    ticket_count INT NOT NULL DEFAULT 1,
    total_amount NUMERIC(10, 2) NOT NULL,
    ticket_numbers INT[] NOT NULL DEFAULT '{}',
    payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('completed', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    plan_tier TEXT NOT NULL DEFAULT 'standard',
    status subscription_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR MULTI-TENANT QUERY OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_sorteos_company_id ON public.sorteos(company_id);
CREATE INDEX IF NOT EXISTS idx_participaciones_company_id ON public.participaciones(company_id);
CREATE INDEX IF NOT EXISTS idx_participaciones_sorteo_id ON public.participaciones(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- ==============================================================================
-- 8. HELPER FUNCTIONS FOR SECURITY & RBAC
-- ==============================================================================

-- Check if current user is Super Admin (sanchezmanuel397@gmail.com)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    coalesce(auth.jwt() ->> 'email', '') = 'sanchezmanuel397@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND email = 'sanchezmanuel397@gmail.com'
    )
  );
$$;

-- Check if current user is Company Admin of a specific company
CREATE OR REPLACE FUNCTION public.is_company_admin_of(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = target_company_id AND admin_email = (auth.jwt() ->> 'email')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND company_id = target_company_id AND role = 'company_admin'
    )
  );
$$;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Companies: Public can read active companies by slug; only super admin can insert
CREATE POLICY "Public read active companies"
    ON public.companies FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

CREATE POLICY "Super admin full access on companies"
    ON public.companies FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Sorteos: Public can read active sorteos; company admin can manage
CREATE POLICY "Public read active sorteos"
    ON public.sorteos FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

CREATE POLICY "Company admin can manage company sorteos"
    ON public.sorteos FOR ALL
    TO authenticated
    USING (public.is_company_admin_of(company_id))
    WITH CHECK (public.is_company_admin_of(company_id));

-- Participaciones: Anyone can purchase; only company admin can view
CREATE POLICY "Public can insert participaciones"
    ON public.participaciones FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Company admin can view participaciones"
    ON public.participaciones FOR SELECT
    TO authenticated
    USING (public.is_company_admin_of(company_id));

-- ==============================================================================
-- 10. TRIGGERS: AUTOMATIC PROFILE SYNC & SUPER ADMIN ASSIGNMENT
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assigned_role user_role := 'subscriber';
    assigned_company UUID := NULL;
BEGIN
    IF NEW.email = 'sanchezmanuel397@gmail.com' THEN
        assigned_role := 'super_admin';
    ELSIF (NEW.raw_user_meta_data->>'role') = 'company_admin' THEN
        assigned_role := 'company_admin';
        IF (NEW.raw_user_meta_data->>'company_id') IS NOT NULL THEN
            assigned_company := (NEW.raw_user_meta_data->>'company_id')::UUID;
        END IF;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, company_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        assigned_role,
        assigned_company
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = CASE WHEN NEW.email = 'sanchezmanuel397@gmail.com' THEN 'super_admin' ELSE public.profiles.role END,
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 11. SAMPLE DATA (Demo company + sample raffle)
-- ==============================================================================
INSERT INTO public.companies (id, name, slug, description, admin_email, status)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Demo Eventos SRL', 'demo-eventos', 'Plataforma oficial de sorteos corporativos y rifas', 'admin@demoeventos.com', 'active'),
    ('c2222222-2222-2222-2222-222222222222', 'Apex Gaming Fest', 'apex-gaming', 'Torneos y sorteos de consolas y periféricos gaming', 'contact@apexgaming.com', 'active')
ON CONFLICT (slug) DO UPDATE SET admin_email = EXCLUDED.admin_email;

INSERT INTO public.sorteos (id, company_id, title, description, prize, ticket_price, total_tickets, sold_tickets, draw_date, status)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Gran Sorteo PlayStation 5 Slim + 2 Juegos', 'Participa por una consola PS5 Slim de 1TB edición digital con dos mandos DualSense y juegos a elección.', 'PlayStation 5 Slim 1TB + 2 Mandos', 15.00, 200, 42, timezone('utc'::text, now() + interval '14 days'), 'active')
ON CONFLICT (id) DO NOTHING;
