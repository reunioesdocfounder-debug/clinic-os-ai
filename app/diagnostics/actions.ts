'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createDiagnostic(formData: FormData) {
  const supabase = await createClient();

  const clinic_id = formData.get('clinic_id') as string;
  const period_month = Number(formData.get('period_month'));
  const period_year = Number(formData.get('period_year'));

  const { data, error } = await supabase
    .from('diagnostics')
    .insert({ clinic_id, period_month, period_year, status: 'draft' })
    .select('id')
    .single();

  if (error) {
    redirect(`/diagnostics/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/diagnostics');
  redirect(`/diagnostics/${data.id}`);
}
