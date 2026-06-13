'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@/lib/supabase/database.types';

function numberOrNull(formData: FormData, field: string): number | null {
  const raw = formData.get(field) as string;
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function saveProductMetrics(diagnosticId: string, formData: FormData) {
  const supabase = await createClient();

  const productIds = (formData.get('product_ids') as string)
    .split(',')
    .map((productId) => productId.trim())
    .filter(Boolean);

  for (const productId of productIds) {
    const fields: TablesInsert<'product_metrics'> = {
      diagnostic_id: diagnosticId,
      product_id: productId,
      quantity_sold: numberOrNull(formData, `quantity_sold__${productId}`),
      average_price: numberOrNull(formData, `average_price__${productId}`),
      direct_cost_per_unit: numberOrNull(formData, `direct_cost_per_unit__${productId}`),
      commission_per_unit: numberOrNull(formData, `commission_per_unit__${productId}`),
      team_time_minutes_per_unit: numberOrNull(formData, `team_time_minutes_per_unit__${productId}`),
    };

    const { error } = await supabase
      .from('product_metrics')
      .upsert(fields, { onConflict: 'diagnostic_id,product_id' });

    if (error) {
      redirect(`/diagnostics/${diagnosticId}/products?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath(`/diagnostics/${diagnosticId}`);
  revalidatePath(`/diagnostics/${diagnosticId}/products`);
  redirect(`/diagnostics/${diagnosticId}/products`);
}
