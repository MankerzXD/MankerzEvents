import Link from 'next/link';
import { getCurrentUser, logout } from '@/actions/auth-actions';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight text-neutral-900 flex items-center gap-2">
            <span className="w-3 h-3 bg-neutral-900 inline-block"></span>
            mankerz events
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="text-neutral-600 hover:text-neutral-900 px-2 py-1 transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/dashboard"
              className="text-neutral-600 hover:text-neutral-900 px-2 py-1 transition-colors"
            >
              Company Dashboard
            </Link>
            {user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
              <Link
                href="/super-admin/dashboard"
                className="text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors border border-neutral-300"
              >
                Super Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-mono font-medium text-neutral-900">{user.email}</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                  {user.isSuperAdmin ? 'SUPER ADMIN' : user.role || 'COMPANY ADMIN'}
                </p>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                Acceder
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
