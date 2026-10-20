import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPER_ADMIN_EMAIL } from '../constants';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check for mock/dev session cookie for quick testing when local dev is active
  const devSessionCookie = request.cookies.get('mankerz_dev_user');
  let userEmail: string | null = null;
  let isAuthenticated = false;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      userEmail = user.email || null;
    }
  }

  // Fallback to dev test cookie if active for instant local preview
  if (!isAuthenticated && devSessionCookie?.value) {
    try {
      const parsed = JSON.parse(devSessionCookie.value);
      if (parsed?.email) {
        isAuthenticated = true;
        userEmail = parsed.email;
      }
    } catch {
      // Ignore invalid dev cookie
    }
  }

  const pathname = request.nextUrl.pathname;

  // 1. GUARD: Super Admin Routes (/super-admin/*)
  if (pathname.startsWith('/super-admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Strict validation: Only sanchezmanuel397@gmail.com is allowed
    if (userEmail !== SUPER_ADMIN_EMAIL) {
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      unauthorizedUrl.searchParams.set('requiredEmail', SUPER_ADMIN_EMAIL);
      unauthorizedUrl.searchParams.set('currentEmail', userEmail || 'anónimo');
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // 2. GUARD: Tenant Admin Routes (/[companySlug]/admin)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[1] === 'admin' && segments[0] !== 'super-admin') {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. GUARD: Company Dashboard Routes (/dashboard/*)
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Authenticated user visiting /login
  if (pathname === '/login' && isAuthenticated) {
    if (userEmail === SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}
