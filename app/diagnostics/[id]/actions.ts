'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@/lib/supabase/database.types';
import { buildDiagnostic } from '@/lib/diagnostics/build-diagnostic';

/**
 * Gera (ou regenera) o diagnóstico consolidado: recalcula KPIs e scores,
 * substitui os `diagnostic_findings` existentes pelos recém-gerados
 * (idempotência) e atualiza `diagnostics` com os scores, o resumo executivo
 * e `status = 'completed'`.
 */
export async function generateDiagnostic(diagnosticId: string) {
  const supabase = await createClient();

  const result = await buildDiagnostic(supabase, diagnosticId);

  const { error: deleteError } = await supabase
    .from('diagnostic_findings')
    .delete()
    .eq('diagnostic_id', diagnosticId);

  if (deleteError) {
    redirect(`/diagnostics/${diagnosticId}?error=${encodeURIComponent(deleteError.message)}`);
  }

  if (result.findings.length > 0) {
    const findingsToInsert: TablesInsert<'diagnostic_findings'>[] = result.findings.map((finding) => ({
      ...finding,
      diagnostic_id: diagnosticId,
    }));

    const { error: insertError } = await supabase.from('diagnostic_findings').insert(findingsToInsert);

    if (insertError) {
      redirect(`/diagnostics/${diagnosticId}?error=${encodeURIComponent(insertError.message)}`);
    }
  }

  const { error: updateError } = await supabase
    .from('diagnostics')
    .update({
      general_score: result.generalScore,
      commercial_score: result.pillarScores.commercial_score,
      financial_score: result.pillarScores.financial_score,
      retention_score: result.pillarScores.retention_score,
      marketing_score: result.pillarScores.marketing_score,
      operation_score: result.pillarScores.operation_score,
      executive_summary: result.executiveSummary,
      status: 'completed',
    })
    .eq('id', diagnosticId);

  if (updateError) {
    redirect(`/diagnostics/${diagnosticId}?error=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath(`/diagnostics/${diagnosticId}`);
  redirect(`/diagnostics/${diagnosticId}`);
}
