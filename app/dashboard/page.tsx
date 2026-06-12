import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-gray-600">
        Logado como <strong>{user.email}</strong>
      </p>
      <div className="flex gap-2">
        <Link
          href="/clinics"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver clínicas
        </Link>
        <Link
          href="/clinics/new"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Nova clínica
        </Link>
      </div>
      <div className="flex gap-2">
        <Link
          href="/diagnostics"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver diagnósticos
        </Link>
        <Link
          href="/diagnostics/new"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Novo diagnóstico
        </Link>
      </div>
      <div className="flex gap-2">
        <Link
          href="/products"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver produtos
        </Link>
        <Link
          href="/products/new"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Novo produto
        </Link>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
