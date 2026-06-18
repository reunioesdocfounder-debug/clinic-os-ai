import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MONTHS, monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
import type { DiagnosticStatus } from '@/lib/supabase/database.types';
import { Card } from '@/components/ui/card';
import { ButtonLink, Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Label, Select } from '@/components/ui/field';
import { Badge, type BadgeTone } from '@/components/ui/badge';

const STATUS_TONES: Record<DiagnosticStatus, BadgeTone> = {
  draft: 'yellow',
  completed: 'green',
  archived: 'gray',
};

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic_id?: string; status?: string; year?: string; month?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;

  const { data: allDiagnostics, error } = await supabase
    .from('diagnostics')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  const clinicIds = [...new Set((allDiagnostics ?? []).map((d) => d.clinic_id))];

  const { data: clinics } =
    clinicIds.length > 0
      ? await supabase.from('clinics').select('id, name').in('id', clinicIds)
      : { data: [] as { id: string; name: string }[] };

  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.name]));
  const sortedClinics = [...(clinics ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const years = [...new Set((allDiagnostics ?? []).map((d) => d.period_year))].sort((a, b) => b - a);

  const diagnostics = (allDiagnostics ?? []).filter((diagnostic) => {
    if (filters.clinic_id && diagnostic.clinic_id !== filters.clinic_id) return false;
    if (filters.status && diagnostic.status !== filters.status) return false;
    if (filters.year && diagnostic.period_year !== Number(filters.year)) return false;
    if (filters.month && diagnostic.period_month !== Number(filters.month)) return false;
    return true;
  });

  const hasActiveFilters = Boolean(
    filters.clinic_id || filters.status || filters.year || filters.month,
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageHeader
        title="Diagnósticos"
        actions={
          <>
            <ButtonLink href="/diagnostics/new" variant="primary">
              Novo diagnóstico
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Voltar
            </ButtonLink>
          </>
        }
      />

      <Card padding="p-4" className="mb-4">
        <form method="GET" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="clinic_id">Clínica</Label>
            <Select id="clinic_id" name="clinic_id" defaultValue={filters.clinic_id ?? ''}>
              <option value="">Todas</option>
              {sortedClinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={filters.status ?? ''}>
              <option value="">Todos</option>
              {(Object.keys(STATUS_LABELS) as DiagnosticStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Ano</Label>
            <Select id="year" name="year" defaultValue={filters.year ?? ''}>
              <option value="">Todos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="month">Mês</Label>
            <Select id="month" name="month" defaultValue={filters.month ?? ''}>
              <option value="">Todos</option>
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-4">
            <Button type="submit" variant="primary">
              Filtrar
            </Button>
            {hasActiveFilters && (
              <ButtonLink href="/diagnostics" variant="secondary">
                Limpar filtros
              </ButtonLink>
            )}
          </div>
        </form>
      </Card>

      {error && <Alert tone="error">{error.message}</Alert>}

      {!error && diagnostics.length === 0 && (
        <p className="text-sm text-muted">
          {hasActiveFilters
            ? 'Nenhum diagnóstico encontrado para os filtros selecionados.'
            : 'Nenhum diagnóstico cadastrado ainda.'}
        </p>
      )}

      {!error && diagnostics.length > 0 && (
        <Card padding="p-0" className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {diagnostics.map((diagnostic) => (
            <Link
              key={diagnostic.id}
              href={`/diagnostics/${diagnostic.id}`}
              className="block p-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-surface-hover"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{clinicNameById.get(diagnostic.clinic_id) ?? 'Clínica'}</p>
                <Badge tone={STATUS_TONES[diagnostic.status]}>{STATUS_LABELS[diagnostic.status]}</Badge>
              </div>
              <p className="text-sm text-muted">
                {monthLabel(diagnostic.period_month)} / {diagnostic.period_year}
              </p>
            </Link>
          ))}
        </Card>
      )}
    </main>
  );
}
