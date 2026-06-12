import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createProduct } from '@/app/products/actions';
import { ProductForm } from '@/app/products/product-form';

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await searchParams;

  const { data: clinics, error: clinicsError } = await supabase
    .from('clinics')
    .select('id, name')
    .order('name');

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Novo produto</h1>
        <Link href="/products" className="text-sm text-gray-500 hover:underline">
          Voltar
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {clinicsError && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {clinicsError.message}
        </p>
      )}

      {!clinicsError && clinics?.length === 0 && (
        <p className="text-sm text-gray-500">
          Você ainda não tem clínicas cadastradas.{' '}
          <Link href="/clinics/new" className="text-blue-600 hover:underline">
            Cadastre uma clínica
          </Link>{' '}
          antes de criar um produto.
        </p>
      )}

      {!clinicsError && clinics && clinics.length > 0 && (
        <ProductForm clinics={clinics} action={createProduct} submitLabel="Criar produto" />
      )}
    </main>
  );
}
