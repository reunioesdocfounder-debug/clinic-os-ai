import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS } from '@/app/(app)/products/constants';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const clinicIds = [...new Set((products ?? []).map((p) => p.clinic_id))];

  const { data: clinics } =
    clinicIds.length > 0
      ? await supabase.from('clinics').select('id, name').in('id', clinicIds)
      : { data: [] as { id: string; name: string }[] };

  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.name]));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <div className="flex gap-2">
          <Link
            href="/products/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Novo produto
          </Link>
          <Link
            href="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && products?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum produto cadastrado ainda.</p>
      )}

      {!error && products && products.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200">
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/products/${product.id}/edit`} className="block p-4 hover:bg-gray-50">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {clinicNameById.get(product.clinic_id) ?? 'Clínica'} —{' '}
                  {CATEGORY_LABELS[product.category]} — {product.is_active ? 'Ativo' : 'Inativo'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
