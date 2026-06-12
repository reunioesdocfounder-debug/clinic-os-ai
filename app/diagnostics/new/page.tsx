import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createDiagnostic } from '@/app/diagnostics/actions';
import { MONTHS } from '@/app/diagnostics/constants';

export default async function NewDiagnosticPage({
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

  const now = new Date();

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Novo diagnóstico</h1>
        <Link href="/diagnostics" className="text-sm text-gray-500 hover:underline">
          Voltar
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {clinicsError && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {clinicsError.message}
        </p>
      )}

      {!clinicsError && clinics?.length === 0 && (
        <p className="text-sm text-gray-500">
          Você ainda não tem clínicas cadastradas.{' '}
          <Link href="/clinics/new" className="text-blue-600 hover:underline">
            Cadastre uma clínica
          </Link>{' '}
          antes de criar um diagnóstico.
        </p>
      )}

      {!clinicsError && clinics && clinics.length > 0 && (
        <form action={createDiagnostic} className="space-y-4">
          <div>
            <label htmlFor="clinic_id" className="block text-sm font-medium text-gray-700">
              Clínica *
            </label>
            <select
              id="clinic_id"
              name="clinic_id"
              required
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="period_month" className="block text-sm font-medium text-gray-700">
                Mês *
              </label>
              <select
                id="period_month"
                name="period_month"
                required
                defaultValue={now.getMonth() + 1}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="period_year" className="block text-sm font-medium text-gray-700">
                Ano *
              </label>
              <input
                id="period_year"
                name="period_year"
                type="number"
                required
                min={2000}
                max={2100}
                defaultValue={now.getFullYear()}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Criar diagnóstico
          </button>
        </form>
      )}
    </main>
  );
}
