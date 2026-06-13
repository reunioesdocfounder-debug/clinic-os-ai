import type { Tables } from '@/lib/supabase/database.types';

type ClinicFormValues = Pick<
  Tables<'clinics'>,
  'name' | 'city' | 'state' | 'business_model' | 'years_in_operation' | 'specialties'
>;

export function ClinicForm({
  clinic,
  action,
  submitLabel,
}: {
  clinic?: ClinicFormValues;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={clinic?.name}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={clinic?.city ?? ''}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            Estado (UF)
          </label>
          <input
            id="state"
            name="state"
            type="text"
            maxLength={2}
            placeholder="SP"
            defaultValue={clinic?.state ?? ''}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="business_model" className="block text-sm font-medium text-gray-700">
          Modelo de negócio
        </label>
        <input
          id="business_model"
          name="business_model"
          type="text"
          placeholder="Ex.: clínica própria, franquia, consultório individual"
          defaultValue={clinic?.business_model ?? ''}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="years_in_operation" className="block text-sm font-medium text-gray-700">
          Anos em operação
        </label>
        <input
          id="years_in_operation"
          name="years_in_operation"
          type="number"
          min={0}
          defaultValue={clinic?.years_in_operation ?? ''}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">
          Especialidades
        </label>
        <input
          id="specialties"
          name="specialties"
          type="text"
          placeholder="Separadas por vírgula, ex.: emagrecimento, estética, nutrição"
          defaultValue={clinic?.specialties?.join(', ') ?? ''}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
