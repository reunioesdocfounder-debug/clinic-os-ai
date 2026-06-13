import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clinics', label: 'Clínicas' },
  { href: '/diagnostics', label: 'Diagnósticos' },
  { href: '/products', label: 'Produtos' },
] as const;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-lg font-semibold">ClinicOS AI</span>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-gray-600">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-blue-600">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
