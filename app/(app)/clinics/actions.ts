'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/database.types';

function parseClinicForm(formData: FormData): TablesInsert<'clinics'> {
  const years = formData.get('years_in_operation') as string;
  const specialties = (formData.get('specialties') as string)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    name: formData.get('name') as string,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    business_model: (formData.get('business_model') as string) || null,
    years_in_operation: years ? Number(years) : null,
    specialties,
  };
}

export async function createClinic(formData: FormData) {
  const supabase = await createClient();
  const fields = parseClinicForm(formData);

  const { data, error } = await supabase
    .from('clinics')
    .insert(fields)
    .select('id')
    .single();

  if (error) {
    redirect(`/clinics/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/clinics');
  redirect(`/clinics/${data.id}`);
}

export async function updateClinic(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields: TablesUpdate<'clinics'> = parseClinicForm(formData);

  const { error } = await supabase.from('clinics').update(fields).eq('id', id);

  if (error) {
    redirect(`/clinics/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/clinics');
  revalidatePath(`/clinics/${id}`);
  redirect(`/clinics/${id}`);
}
