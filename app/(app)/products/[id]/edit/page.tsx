import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateProduct } from '@/app/(app)/products/actions';
import { ProductForm } from '@/app/(app)/products/product-form';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const { error: errorMessage } = await searchParams;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <PageHeader
        title="Editar produto"
        actions={
          <ButtonLink href="/products" variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {errorMessage && (
        <Alert tone="error" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <ProductForm
        product={product}
        action={updateProduct.bind(null, id)}
        submitLabel="Salvar alterações"
      />
    </main>
  );
}
