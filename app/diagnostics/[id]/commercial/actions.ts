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

export async function saveCommercialMetrics(diagnosticId: string, formData: FormData) {
  const supabase = await createClient();

  const fields: TablesInsert<'commercial_metrics'> = {
    diagnostic_id: diagnosticId,
    leads: numberOrNull(formData, 'leads'),
    contacted_leads: numberOrNull(formData, 'contacted_leads'),
    scheduled_appointments: numberOrNull(formData, 'scheduled_appointments'),
    attended_appointments: numberOrNull(formData, 'attended_appointments'),
    sales: numberOrNull(formData, 'sales'),
    renewals: numberOrNull(formData, 'renewals'),
    eligible_renewals: numberOrNull(formData, 'eligible_renewals'),
    referrals: numberOrNull(formData, 'referrals'),
    new_patients: numberOrNull(formData, 'new_patients'),
    average_ticket: numberOrNull(formData, 'average_ticket'),
    average_response_time_minutes: numberOrNull(formData, 'average_response_time_minutes'),
    average_days_until_appointment: numberOrNull(formData, 'average_days_until_appointment'),
  };

  const { error } = await supabase
    .from('commercial_metrics')
    .upsert(fields, { onConflict: 'diagnostic_id' });

  if (error) {
    redirect(`/diagnostics/${diagnosticId}/commercial?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/diagnostics/${diagnosticId}`);
  revalidatePath(`/diagnostics/${diagnosticId}/commercial`);
  redirect(`/diagnostics/${diagnosticId}/commercial`);
}
