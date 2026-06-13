import type { Tables } from '@/lib/supabase/database.types';

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
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              id={key}
              name={key}
              type="number"
              step="0.01"
              min={0}
              defaultValue={metrics?.[key] ?? ''}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Salvar métricas
      </button>
    </form>
  );
}
