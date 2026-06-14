import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createProduct } from '@/app/(app)/products/actions';
import { ProductForm } from '@/app/(app)/products/product-form';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

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
      <PageHeader
        title="Novo produto"
        actions={
          <ButtonLink href="/products" variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {clinicsError && (
        <Alert tone="error" className="mb-4">
          {clinicsError.message}
        </Alert>
      )}

      {!clinicsError && clinics?.length === 0 && (
        <p className="text-sm text-muted">
          Você ainda não tem clínicas cadastradas.{' '}
          <Link href="/clinics/new" className="text-accent hover:underline">
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
