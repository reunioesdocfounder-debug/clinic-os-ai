// ============================================================================
// ClinicOS AI — Tipos do banco (Supabase / PostgreSQL)
// Gerado manualmente a partir de
// supabase/migrations/20260612120000_initial_schema.sql
//
// Quando o projeto Supabase estiver linkado, recomenda-se substituir este
// arquivo pela versão gerada via CLI para manter 100% de fidelidade:
//   npx supabase gen types typescript --project-id <ref> --schema public \
//     > lib/supabase/database.types.ts
//
// Nota: colunas `numeric` (ex.: gross_revenue, average_ticket) são tipadas
// como `number` aqui (igual ao gerador oficial), mas o supabase-js pode
// devolvê-las como `string` em runtime — ver nota em lib/kpis/types.ts.
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ----------------------------------------------------------------------------
// Valores fixos (check constraints) — RULES_ENGINE.md / migração inicial
// ----------------------------------------------------------------------------
export type DiagnosticStatus = 'draft' | 'completed' | 'archived';
export type ProductCategory =
  | 'emagrecimento'
  | 'reposicao_hormonal'
  | 'soroterapia'
  | 'nutricao'
  | 'estetica'
  | 'consulta'
  | 'outro';
export type Pillar = 'commercial' | 'financial' | 'retention' | 'marketing' | 'operation';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ActionPlanStatus = 'planned' | 'in_progress' | 'completed' | 'paused';
export type TaskStatus = 'todo' | 'doing' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          city: string | null;
          state: string | null;
          business_model: string | null;
          years_in_operation: number | null;
          specialties: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          city?: string | null;
          state?: string | null;
          business_model?: string | null;
          years_in_operation?: number | null;
          specialties?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          city?: string | null;
          state?: string | null;
          business_model?: string | null;
          years_in_operation?: number | null;
          specialties?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      clinic_team: {
        Row: {
          id: string;
          clinic_id: string;
          doctors_count: number;
          nutritionists_count: number;
          receptionists_count: number;
          sales_people_count: number;
          managers_count: number;
          other_staff_count: number;
          total_payroll: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          doctors_count?: number;
          nutritionists_count?: number;
          receptionists_count?: number;
          sales_people_count?: number;
          managers_count?: number;
          other_staff_count?: number;
          total_payroll?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          doctors_count?: number;
          nutritionists_count?: number;
          receptionists_count?: number;
          sales_people_count?: number;
          managers_count?: number;
          other_staff_count?: number;
          total_payroll?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clinic_team_clinic_id_fkey';
            columns: ['clinic_id'];
            isOneToOne: true;
            referencedRelation: 'clinics';
            referencedColumns: ['id'];
          },
        ];
      };

      diagnostics: {
        Row: {
          id: string;
          clinic_id: string;
          period_month: number;
          period_year: number;
          status: DiagnosticStatus;
          general_score: number | null;
          commercial_score: number | null;
          financial_score: number | null;
          retention_score: number | null;
          marketing_score: number | null;
          operation_score: number | null;
          executive_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          period_month: number;
          period_year: number;
          status?: DiagnosticStatus;
          general_score?: number | null;
          commercial_score?: number | null;
          financial_score?: number | null;
          retention_score?: number | null;
          marketing_score?: number | null;
          operation_score?: number | null;
          executive_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          period_month?: number;
          period_year?: number;
          status?: DiagnosticStatus;
          general_score?: number | null;
          commercial_score?: number | null;
          financial_score?: number | null;
          retention_score?: number | null;
          marketing_score?: number | null;
          operation_score?: number | null;
          executive_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'diagnostics_clinic_id_fkey';
            columns: ['clinic_id'];
            isOneToOne: false;
            referencedRelation: 'clinics';
            referencedColumns: ['id'];
          },
        ];
      };

      commercial_metrics: {
        Row: {
          id: string;
          diagnostic_id: string;
          leads: number | null;
          contacted_leads: number | null;
          scheduled_appointments: number | null;
          attended_appointments: number | null;
          sales: number | null;
          renewals: number | null;
          eligible_renewals: number | null;
          referrals: number | null;
          new_patients: number | null;
          average_ticket: number | null;
          average_response_time_minutes: number | null;
          average_days_until_appointment: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          leads?: number | null;
          contacted_leads?: number | null;
          scheduled_appointments?: number | null;
          attended_appointments?: number | null;
          sales?: number | null;
          renewals?: number | null;
          eligible_renewals?: number | null;
          referrals?: number | null;
          new_patients?: number | null;
          average_ticket?: number | null;
          average_response_time_minutes?: number | null;
          average_days_until_appointment?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          leads?: number | null;
          contacted_leads?: number | null;
          scheduled_appointments?: number | null;
          attended_appointments?: number | null;
          sales?: number | null;
          renewals?: number | null;
          eligible_renewals?: number | null;
          referrals?: number | null;
          new_patients?: number | null;
          average_ticket?: number | null;
          average_response_time_minutes?: number | null;
          average_days_until_appointment?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'commercial_metrics_diagnostic_id_fkey';
            columns: ['diagnostic_id'];
            isOneToOne: true;
            referencedRelation: 'diagnostics';
            referencedColumns: ['id'];
          },
        ];
      };

      financial_metrics: {
        Row: {
          id: string;
          diagnostic_id: string;
          gross_revenue: number | null;
          taxes: number | null;
          direct_costs: number | null;
          payroll: number | null;
          marketing_expenses: number | null;
          commissions: number | null;
          operational_expenses: number | null;
          financial_expenses: number | null;
          other_expenses: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          gross_revenue?: number | null;
          taxes?: number | null;
          direct_costs?: number | null;
          payroll?: number | null;
          marketing_expenses?: number | null;
          commissions?: number | null;
          operational_expenses?: number | null;
          financial_expenses?: number | null;
          other_expenses?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          gross_revenue?: number | null;
          taxes?: number | null;
          direct_costs?: number | null;
          payroll?: number | null;
          marketing_expenses?: number | null;
          commissions?: number | null;
          operational_expenses?: number | null;
          financial_expenses?: number | null;
          other_expenses?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_metrics_diagnostic_id_fkey';
            columns: ['diagnostic_id'];
            isOneToOne: true;
            referencedRelation: 'diagnostics';
            referencedColumns: ['id'];
          },
        ];
      };

      products: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          category: ProductCategory;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          category?: ProductCategory;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          category?: ProductCategory;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_clinic_id_fkey';
            columns: ['clinic_id'];
            isOneToOne: false;
            referencedRelation: 'clinics';
            referencedColumns: ['id'];
          },
        ];
      };

      product_metrics: {
        Row: {
          id: string;
          diagnostic_id: string;
          product_id: string;
          quantity_sold: number | null;
          average_price: number | null;
          direct_cost_per_unit: number | null;
          commission_per_unit: number | null;
          team_time_minutes_per_unit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          product_id: string;
          quantity_sold?: number | null;
          average_price?: number | null;
          direct_cost_per_unit?: number | null;
          commission_per_unit?: number | null;
          team_time_minutes_per_unit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          product_id?: string;
          quantity_sold?: number | null;
          average_price?: number | null;
          direct_cost_per_unit?: number | null;
          commission_per_unit?: number | null;
          team_time_minutes_per_unit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_metrics_diagnostic_id_fkey';
            columns: ['diagnostic_id'];
            isOneToOne: false;
            referencedRelation: 'diagnostics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_metrics_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };

      diagnostic_findings: {
        Row: {
          id: string;
          diagnostic_id: string;
          pillar: Pillar;
          severity: Severity;
          title: string;
          description: string | null;
          evidence: Json;
          estimated_impact: string | null;
          priority_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          pillar: Pillar;
          severity: Severity;
          title: string;
          description?: string | null;
          evidence?: Json;
          estimated_impact?: string | null;
          priority_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          pillar?: Pillar;
          severity?: Severity;
          title?: string;
          description?: string | null;
          evidence?: Json;
          estimated_impact?: string | null;
          priority_score?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'diagnostic_findings_diagnostic_id_fkey';
            columns: ['diagnostic_id'];
            isOneToOne: false;
            referencedRelation: 'diagnostics';
            referencedColumns: ['id'];
          },
        ];
      };

      action_plans: {
        Row: {
          id: string;
          diagnostic_id: string;
          title: string;
          description: string | null;
          objective: string | null;
          expected_result: string | null;
          status: ActionPlanStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          title: string;
          description?: string | null;
          objective?: string | null;
          expected_result?: string | null;
          status?: ActionPlanStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          diagnostic_id?: string;
          title?: string;
          description?: string | null;
          objective?: string | null;
          expected_result?: string | null;
          status?: ActionPlanStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'action_plans_diagnostic_id_fkey';
            columns: ['diagnostic_id'];
            isOneToOne: false;
            referencedRelation: 'diagnostics';
            referencedColumns: ['id'];
          },
        ];
      };

      action_plan_phases: {
        Row: {
          id: string;
          action_plan_id: string;
          title: string;
          description: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          action_plan_id: string;
          title: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          action_plan_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'action_plan_phases_action_plan_id_fkey';
            columns: ['action_plan_id'];
            isOneToOne: false;
            referencedRelation: 'action_plans';
            referencedColumns: ['id'];
          },
        ];
      };

      tasks: {
        Row: {
          id: string;
          phase_id: string;
          title: string;
          description: string | null;
          owner: string | null;
          due_date: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          expected_kpi: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phase_id: string;
          title: string;
          description?: string | null;
          owner?: string | null;
          due_date?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          expected_kpi?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phase_id?: string;
          title?: string;
          description?: string | null;
          owner?: string | null;
          due_date?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          expected_kpi?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_phase_id_fkey';
            columns: ['phase_id'];
            isOneToOne: false;
            referencedRelation: 'action_plan_phases';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      owns_clinic: {
        Args: { p_clinic_id: string };
        Returns: boolean;
      };
      owns_diagnostic: {
        Args: { p_diagnostic_id: string };
        Returns: boolean;
      };
      owns_action_plan: {
        Args: { p_action_plan_id: string };
        Returns: boolean;
      };
      owns_phase: {
        Args: { p_phase_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ----------------------------------------------------------------------------
// Helpers de conveniência — uso: Tables<'clinics'>, TablesInsert<'diagnostics'>
// ----------------------------------------------------------------------------
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
