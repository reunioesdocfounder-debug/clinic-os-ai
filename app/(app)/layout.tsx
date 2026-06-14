import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-lg font-semibold">ClinicOS AI</span>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-muted">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{user.email}</span>
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
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
