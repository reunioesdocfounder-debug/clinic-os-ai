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

export async function saveFinancialMetrics(diagnosticId: string, formData: FormData) {
  const supabase = await createClient();

  const fields: TablesInsert<'financial_metrics'> = {
    diagnostic_id: diagnosticId,
    gross_revenue: numberOrNull(formData, 'gross_revenue'),
    taxes: numberOrNull(formData, 'taxes'),
    direct_costs: numberOrNull(formData, 'direct_costs'),
    payroll: numberOrNull(formData, 'payroll'),
    marketing_expenses: numberOrNull(formData, 'marketing_expenses'),
    commissions: numberOrNull(formData, 'commissions'),
    operational_expenses: numberOrNull(formData, 'operational_expenses'),
    financial_expenses: numberOrNull(formData, 'financial_expenses'),
    other_expenses: numberOrNull(formData, 'other_expenses'),
  };

  const { error } = await supabase
    .from('financial_metrics')
    .upsert(fields, { onConflict: 'diagnostic_id' });

  if (error) {
    redirect(`/diagnostics/${diagnosticId}/financial?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/diagnostics/${diagnosticId}`);
  revalidatePath(`/diagnostics/${diagnosticId}/financial`);
  redirect(`/diagnostics/${diagnosticId}/financial`);
}
