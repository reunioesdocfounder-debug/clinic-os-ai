'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ProductCategory, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types';

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const fields: TablesInsert<'products'> = {
    clinic_id: formData.get('clinic_id') as string,
    name: formData.get('name') as string,
    category: formData.get('category') as ProductCategory,
    is_active: formData.get('is_active') === 'on',
  };

  const { error } = await supabase.from('products').insert(fields);

  if (error) {
    redirect(`/products/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();

  const fields: TablesUpdate<'products'> = {
    name: formData.get('name') as string,
    category: formData.get('category') as ProductCategory,
    is_active: formData.get('is_active') === 'on',
  };

  const { error } = await supabase.from('products').update(fields).eq('id', id);

  if (error) {
    redirect(`/products/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/products');
  redirect('/products');
}
