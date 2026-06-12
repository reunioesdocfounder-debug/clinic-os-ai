import type { Tables } from '@/lib/supabase/database.types';

type CommercialMetricsValues = Pick<
  Tables<'commercial_metrics'>,
  | 'leads'
  | 'contacted_leads'
  | 'scheduled_appointments'
  | 'attended_appointments'
  | 'sales'
  | 'renewals'
  | 'eligible_renewals'
  | 'referrals'
  | 'new_patients'
  | 'average_ticket'
  | 'average_response_time_minutes'
  | 'average_days_until_appointment'
>;

const FIELDS: { key: keyof CommercialMetricsValues; label: string; step?: string }[] = [
  { key: 'leads', label: 'Leads' },
  { key: 'contacted_leads', label: 'Leads contatados' },
  { key: 'scheduled_appointments', label: 'Agendamentos' },
  { key: 'attended_appointments', label: 'Atendimentos realizados' },
  { key: 'sales', label: 'Vendas' },
  { key: 'renewals', label: 'Renovações' },
  { key: 'eligible_renewals', label: 'Elegíveis para renovação' },
  { key: 'referrals', label: 'Indicações' },
  { key: 'new_patients', label: 'Novos pacientes' },
  { key: 'average_ticket', label: 'Ticket médio (R$)', step: '0.01' },
  { key: 'average_response_time_minutes', label: 'Tempo médio de resposta (min)', step: '0.01' },
  { key: 'average_days_until_appointment', label: 'Dias médios até atendimento', step: '0.01' },
];

export function CommercialForm({
  metrics,
  action,
}: {
  metrics?: CommercialMetricsValues | null;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, step }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              id={key}
              name={key}
              type="number"
              step={step ?? '1'}
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
