import type { Tables } from '@/lib/supabase/database.types';
import { Label, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

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
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" type="text" required defaultValue={clinic?.name} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" type="text" defaultValue={clinic?.city ?? ''} />
        </div>

        <div>
          <Label htmlFor="state">Estado (UF)</Label>
          <Input
            id="state"
            name="state"
            type="text"
            maxLength={2}
            placeholder="SP"
            defaultValue={clinic?.state ?? ''}
            className="uppercase"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="business_model">Modelo de negócio</Label>
        <Input
          id="business_model"
          name="business_model"
          type="text"
          placeholder="Ex.: clínica própria, franquia, consultório individual"
          defaultValue={clinic?.business_model ?? ''}
        />
      </div>

      <div>
        <Label htmlFor="years_in_operation">Anos em operação</Label>
        <Input
          id="years_in_operation"
          name="years_in_operation"
          type="number"
          min={0}
          defaultValue={clinic?.years_in_operation ?? ''}
        />
      </div>

      <div>
        <Label htmlFor="specialties">Especialidades</Label>
        <Input
          id="specialties"
          name="specialties"
          type="text"
          placeholder="Separadas por vírgula, ex.: emagrecimento, estética, nutrição"
          defaultValue={clinic?.specialties?.join(', ') ?? ''}
        />
      </div>

      <Button type="submit" variant="primary">
        {submitLabel}
      </Button>
    </form>
  );
}
