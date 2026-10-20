import { loginWithEmail, setDevRole } from '@/actions/auth-actions';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { Navbar } from '@/components/Navbar';

interface Props {
  searchParams: Promise<{
    returnUrl?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Acceso — Mankerz Events',
  description: 'Iniciar sesión en la plataforma multi-tenant de Mankerz Events.',
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const returnUrl = params.returnUrl || '';

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-neutral-200 p-8 space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Accede a tu panel corporativo en Mankerz Events.
            </p>
          </div>

          {/* Direct credentials form */}
          <form action={loginWithEmail} className="space-y-4">
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1"
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition-colors border border-neutral-900 cursor-pointer"
            >
              Entrar al Sistema
            </button>
          </form>

          {/* Quick Demo Switcher for Instant RBAC Verification */}
          <div className="pt-6 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Acceso Rápido para Pruebas (RBAC)
              </span>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 border border-neutral-300">
                MVP Demo
              </span>
            </div>

            <div className="space-y-2">
              <form action={setDevRole.bind(null, 'super_admin')}>
                <button
                  type="submit"
                  className="w-full text-left p-3 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">
                      Entrar como Super Admin
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {SUPER_ADMIN_EMAIL}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">/super-admin →</span>
                </button>
              </form>

              <form action={setDevRole.bind(null, 'company_admin')}>
                <button
                  type="submit"
                  className="w-full text-left p-3 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">
                      Entrar como Company Admin (Demo)
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      admin@demoeventos.com (Demo Eventos SRL)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">/demo-eventos/admin →</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
