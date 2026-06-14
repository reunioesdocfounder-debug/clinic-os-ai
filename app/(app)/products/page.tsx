import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS } from '@/app/(app)/products/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

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
      <PageHeader
        title="Produtos"
        actions={
          <>
            <ButtonLink href="/products/new" variant="primary">
              Novo produto
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Voltar
            </ButtonLink>
          </>
        }
      />

      {error && <Alert tone="error">{error.message}</Alert>}

      {!error && products?.length === 0 && (
        <p className="text-sm text-muted">Nenhum produto cadastrado ainda.</p>
      )}

      {!error && products && products.length > 0 && (
        <Card padding="p-0" className="divide-y divide-border">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}/edit`}
              className="block p-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-surface-hover"
            >
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted">
                {clinicNameById.get(product.clinic_id) ?? 'Clínica'} —{' '}
                {CATEGORY_LABELS[product.category]} — {product.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </Link>
          ))}
        </Card>
      )}
    </main>
  );
}
