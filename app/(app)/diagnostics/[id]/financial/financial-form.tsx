import type { Tables } from '@/lib/supabase/database.types';
import { Label, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

type FinancialMetricsValues = Pick<
  Tables<'financial_metrics'>,
  | 'gross_revenue'
  | 'taxes'
  | 'direct_costs'
  | 'payroll'
  | 'marketing_expenses'
  | 'commissions'
  | 'operational_expenses'
  | 'financial_expenses'
  | 'other_expenses'
>;

const FIELDS: { key: keyof FinancialMetricsValues; label: string }[] = [
  { key: 'gross_revenue', label: 'Receita bruta (R$)' },
  { key: 'taxes', label: 'Impostos (R$)' },
  { key: 'direct_costs', label: 'Custos diretos (R$)' },
  { key: 'payroll', label: 'Folha de pagamento (R$)' },
  { key: 'marketing_expenses', label: 'Despesas de marketing (R$)' },
  { key: 'commissions', label: 'Comissões (R$)' },
  { key: 'operational_expenses', label: 'Despesas operacionais (R$)' },
  { key: 'financial_expenses', label: 'Despesas financeiras (R$)' },
  { key: 'other_expenses', label: 'Outras despesas (R$)' },
];

export function FinancialForm({
  metrics,
  action,
}: {
  metrics?: FinancialMetricsValues | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} name={key} type="number" step="0.01" min={0} defaultValue={metrics?.[key] ?? ''} />
          </div>
        ))}
      </div>

      <Button type="submit" variant="primary">
        Salvar métricas
      </Button>
    </form>
  );
}
