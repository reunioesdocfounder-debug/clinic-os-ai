// ============================================================================
// ClinicOS AI — KPIs Comerciais
// Ref.: docs/RULES_ENGINE.md secao 1.1
// ============================================================================

import type { CommercialKpis, CommercialMetricsInput } from './types';
import { safeDivide } from './utils';

export function calculateCommercialKpis(input: CommercialMetricsInput): CommercialKpis {
  return {
    contact_rate: safeDivide(input.contacted_leads, input.leads),
    scheduling_rate: safeDivide(input.scheduled_appointments, input.leads),
    attendance_rate: safeDivide(input.attended_appointments, input.scheduled_appointments),
    conversion_rate: safeDivide(input.sales, input.attended_appointments),
    renewal_rate: safeDivide(input.renewals, input.eligible_renewals),
    referral_rate: safeDivide(input.referrals, input.new_patients),
  };
}
