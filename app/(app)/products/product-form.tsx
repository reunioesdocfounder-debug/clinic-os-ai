import type { Tables } from '@/lib/supabase/database.types';
import { CATEGORIES, CATEGORY_LABELS } from '@/app/(app)/products/constants';

type ProductFormValues = Pick<Tables<'products'>, 'name' | 'category' | 'is_active'>;

export function ProductForm({
  product,
  clinics,
  action,
  submitLabel,
}: {
  product?: ProductFormValues;
  clinics?: { id: string; name: string }[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {clinics && (
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
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={product?.name}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <select
          id="category"
          name="category"
          defaultValue={product?.category ?? 'outro'}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={product?.is_active ?? true}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Produto ativo
        </label>
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
