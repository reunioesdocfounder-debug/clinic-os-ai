import type { ProductCategory } from '@/lib/supabase/database.types';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  emagrecimento: 'Emagrecimento',
  reposicao_hormonal: 'Reposição hormonal',
  soroterapia: 'Soroterapia',
  nutricao: 'Nutrição',
  estetica: 'Estética',
  consulta: 'Consulta',
  outro: 'Outro',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];
