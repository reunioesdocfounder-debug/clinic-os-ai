import type { Tables } from '@/lib/supabase/database.types';
import { CATEGORIES, CATEGORY_LABELS } from '@/app/(app)/products/constants';
import { Label, Input, Select, Checkbox } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

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
          <Label htmlFor="clinic_id">Clínica *</Label>
          <Select id="clinic_id" name="clinic_id" required>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" type="text" required defaultValue={product?.name} />
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select id="category" name="category" defaultValue={product?.category ?? 'outro'}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="is_active" name="is_active" defaultChecked={product?.is_active ?? true} />
        <Label htmlFor="is_active">Produto ativo</Label>
      </div>

      <Button type="submit" variant="primary">
        {submitLabel}
      </Button>
    </form>
  );
}
