# RULES_ENGINE.md — ClinicOS AI

## Motor de KPIs, Benchmarks e Diagnóstico

Este documento define as regras de negócio usadas pela camada de cálculo de
KPIs e pelo motor de diagnóstico (`diagnostics`, `diagnostic_findings`,
`action_plans`). Ele é a fonte de verdade para a implementação em
`lib/kpis/`.

Fontes: `docs/PRD.md`, `docs/DATABASE.md`,
`supabase/migrations/20260612120000_initial_schema.sql`.

> Convenção: nomes de campos em `snake_case` correspondem 1:1 às colunas das
> tabelas `commercial_metrics`, `financial_metrics`, `product_metrics` e
> `diagnostics`.

---

# 1. Lista de KPIs Calculados

## 1.1 Comerciais (`commercial_metrics`)

| KPI | Campo de saída | Fórmula |
| --- | --- | --- |
| Taxa de Contato | `contact_rate` | `contacted_leads / leads` |
| Taxa de Agendamento | `scheduling_rate` | `scheduled_appointments / leads` |
| Taxa de Comparecimento | `attendance_rate` | `attended_appointments / scheduled_appointments` |
| Taxa de Conversão | `conversion_rate` | `sales / attended_appointments` |
| Taxa de Renovação | `renewal_rate` | `renewals / eligible_renewals` |
| Taxa de Indicação | `referral_rate` | `referrals / new_patients` |

Campos de entrada não convertidos em taxa (usados diretamente nas regras):

- `average_ticket`
- `average_response_time_minutes`
- `average_days_until_appointment`

## 1.2 Financeiros (`financial_metrics`)

| KPI | Campo de saída | Fórmula |
| --- | --- | --- |
| Receita Líquida | `net_revenue` | `gross_revenue - taxes` |
| Lucro Bruto | `gross_profit` | `net_revenue - direct_costs` |
| EBITDA | `ebitda` | `gross_profit - (payroll + marketing_expenses + commissions + operational_expenses + other_expenses)` |
| Lucro Líquido | `net_profit` | `ebitda - financial_expenses` |
| Margem Bruta | `gross_margin` | `gross_profit / gross_revenue` |
| Margem Líquida | `net_margin` | `net_profit / gross_revenue` |
| % Folha sobre Faturamento | `payroll_percentage` | `payroll / gross_revenue` |
| % Marketing sobre Faturamento | `marketing_percentage` | `marketing_expenses / gross_revenue` |

### Definição: Custos Diretos vs. Despesas Operacionais (sem dupla contagem)

Para evitar que o mesmo gasto seja contado duas vezes (uma em `direct_costs`
e novamente em `commissions`/`operational_expenses`), o limite entre as
categorias é **fixo e mutuamente exclusivo**:

- **`direct_costs`** inclui **apenas** os custos diretamente ligados à
  entrega do serviço/produto ao paciente:
  - Repasse médico
  - Repasse de nutricionista
  - Insumos
  - Exames
  - Materiais

- **`commissions`** (comissões comerciais sobre vendas) **NÃO** fazem parte
  de `direct_costs`. São sempre tratadas como **despesa operacional** e
  entram apenas no cálculo do EBITDA, dentro de "despesas operacionais
  totais" — junto com `payroll`, `marketing_expenses`,
  `operational_expenses` (não categorizadas) e `other_expenses`.

> **Regra de preenchimento:** ao reportar `direct_costs`, comissões
> comerciais sobre a venda NUNCA devem ser somadas a esse valor — elas vão
> exclusivamente em `commissions`.

### Cadeia de cálculo (recalculada)

```
net_revenue  = gross_revenue - taxes

gross_profit = net_revenue - direct_costs
  // direct_costs = repasse médico + nutricionista + insumos
  //                + exames + materiais (NUNCA inclui comissões)

ebitda       = gross_profit - (payroll + marketing_expenses + commissions
                                + operational_expenses + other_expenses)
  // comissões entram aqui, uma única vez

net_profit   = ebitda - financial_expenses
```

`financial_expenses` (juros/dívida) só é deduzido depois do EBITDA, na
apuração do Lucro Líquido — coerente com a definição contábil de EBITDA
(Earnings Before Interest, Taxes, Depreciation and Amortization).

#### Exemplo numérico

| Campo | Valor (R$) |
| --- | ---: |
| `gross_revenue` | 100.000 |
| `taxes` | 8.000 |
| `direct_costs` (repasses + insumos + exames + materiais) | 25.000 |
| `payroll` | 30.000 |
| `marketing_expenses` | 8.000 |
| `commissions` | 5.000 |
| `operational_expenses` | 7.000 |
| `other_expenses` | 2.000 |
| `financial_expenses` | 3.000 |

```
net_revenue  = 100.000 - 8.000                         = 92.000
gross_profit = 92.000 - 25.000                         = 67.000
ebitda       = 67.000 - (30.000 + 8.000 + 5.000 + 7.000 + 2.000)
             = 67.000 - 52.000                         = 15.000
net_profit   = 15.000 - 3.000                          = 12.000
```

## 1.3 Produtos (`product_metrics`)

| KPI | Campo de saída | Fórmula |
| --- | --- | --- |
| Receita do Produto | `product_revenue` | `quantity_sold * average_price` |
| Custo Total do Produto | `product_total_cost` | `quantity_sold * (direct_cost_per_unit + commission_per_unit)` |
| Lucro Bruto do Produto | `product_gross_profit` | `product_revenue - product_total_cost` |
| Margem do Produto | `product_margin` | `product_gross_profit / product_revenue` |
| Tempo Total da Equipe | `total_team_time_minutes` | `quantity_sold * team_time_minutes_per_unit` |
| Ranking | `ranking` | posição do produto ao ordenar todos os produtos do diagnóstico por `product_gross_profit` (desc) |

## 1.4 Diagnóstico (`diagnostics`)

| KPI | Campo de saída | Descrição |
| --- | --- | --- |
| Score por pilar | `commercial_score`, `financial_score`, `retention_score`, `marketing_score`, `operation_score` | 0–100, calculado a partir dos KPIs do pilar vs. benchmarks (seção 2) |
| Score Geral | `general_score` | Média ponderada dos scores por pilar (pesos da seção 1.5) |

## 1.5 Pesos dos Pilares (PRD §7)

| Pilar | Campo | Peso |
| --- | --- | ---: |
| Comercial | `commercial_score` | 25 |
| Financeiro | `financial_score` | 30 |
| Retenção | `retention_score` | 20 |
| Marketing | `marketing_score` | 15 |
| Operação | `operation_score` | 10 |

```
general_score = commercial_score * 0.25
              + financial_score  * 0.30
              + retention_score  * 0.20
              + marketing_score  * 0.15
              + operation_score  * 0.10
```

## 1.6 Classificação do Score (PRD §7)

| Score | Status |
| --- | --- |
| 0–39 | Crítico |
| 40–59 | Atenção |
| 60–79 | Bom |
| 80–100 | Excelente |

Esta mesma escala 0–100 / 4 faixas é reutilizada para o score de cada KPI
individual (seção 2).

---

# 2. Benchmarks por KPI

Apenas **KPIs em formato de taxa/percentual/tempo** recebem benchmark — KPIs
em valores absolutos (R$), como `net_revenue`, `ebitda`, `product_revenue`
etc., variam demais com o porte da clínica e não são comparáveis entre
clínicas. Eles entram nas regras apenas via seus derivados percentuais
(`gross_margin`, `net_margin`, `payroll_percentage`, `marketing_percentage`).

Cada benchmark define 4 faixas que mapeiam o valor do KPI para um **score de
0–100** (mesma classificação da seção 1.6). `direction` indica se valores
maiores são melhores (`up`) ou piores (`down`).

> **Valores marcados como "referência"** são estimativas iniciais para
> clínicas premium, calibráveis pelo consultor à medida que mais diagnósticos
> forem realizados. Valores marcados como **"PRD"** vêm diretamente do Motor
> de Regras (seção 3).

## 2.1 Comerciais

| KPI | Direção | Crítico (score 0–39) | Atenção (40–59) | Bom (60–79) | Excelente (80–100) | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| `contact_rate` | up | `< 50%` | `50–69%` | `70–89%` | `≥ 90%` | referência |
| `scheduling_rate` | up | `< 30%` | `30–49%` | `50–69%` | `≥ 70%` | referência |
| `attendance_rate` | up | `< 60%` | `60–74%` | `75–89%` | `≥ 90%` | PRD (Regra 001 = 75%) |
| `conversion_rate` | up | `< 20%` | `20–34%` | `35–49%` | `≥ 50%` | referência |
| `renewal_rate` | up | `< 40%` | `40–59%` | `60–79%` | `≥ 80%` | referência |
| `referral_rate` | up | `< 5%` | `5–9%` | `10–19%` | `≥ 20%` | PRD (Regra 005 = 10%) |
| `average_response_time_minutes` | down | `> 15 min` | `10–15 min` | `5–10 min` | `≤ 5 min` | PRD (Regra 002 = 15 min) |
| `average_days_until_appointment` | down | `> 7 dias` | `4–7 dias` | `2–4 dias` | `≤ 2 dias` | referência |

## 2.2 Financeiros

| KPI | Direção | Crítico (0–39) | Atenção (40–59) | Bom (60–79) | Excelente (80–100) | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| `gross_margin` | up | `< 30%` | `30–49%` | `50–69%` | `≥ 70%` | referência |
| `net_margin` | up | `< 10%` | `10–14%` | `15–24%` | `≥ 25%` | PRD (Regra 003 = 10%) |
| `payroll_percentage` | down | `> 45%` | `35–45%` | `25–35%` | `≤ 25%` | PRD (Regra 004 = 40% → faixa "Atenção") |
| `marketing_percentage` | down | `> 20%` | `15–20%` | `8–15%` | `≤ 8%` | referência |

## 2.3 Produto

| KPI | Direção | Crítico (0–39) | Atenção (40–59) | Bom (60–79) | Excelente (80–100) | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| `product_margin` | up | `< 30%` | `30–49%` | `50–69%` | `≥ 70%` | referência |

## 2.4 Como o score de um KPI é calculado

Dentro de cada faixa, o score é **interpolado linearmente** entre os limites
da faixa (0–39, 40–59, 60–79, 80–100), usando os limites de valor do KPI como
extremos. Valores fora da última faixa são limitados (`clamp`) a 0 ou 100.

Exemplo (`attendance_rate`, direção `up`):

- `attendance_rate = 50%` → cai na faixa Crítico (`< 60%`) → score próximo de
  0–39, interpolado entre 0% (score 0) e 60% (score 39).
- `attendance_rate = 82%` → cai na faixa Bom (`75–89%`) → score entre 60 e 79,
  interpolado linearmente.

A implementação dessa interpolação é a função `scoreFromBenchmark` em
`lib/kpis/benchmarks.ts`.

## 2.5 Score por pilar

`commercial_score`, `financial_score`, `retention_score` e `marketing_score`
são a **média aritmética dos scores dos KPIs daquele pilar** (mapeamento de
pilar na seção 3). `operation_score` é calculado de forma direta a partir de
`average_days_until_appointment`, usando o benchmark dedicado em faixas fixas
da seção 3.5 (não a interpolação linear genérica da seção 2.1).

No MVP, os pilares **Retenção** e **Marketing** possuem apenas 1 KPI mapeado
cada (`renewal_rate` e `referral_rate`, respectivamente) e **Operação**
possui 1 KPI mapeado (`average_days_until_appointment`, seção 3.5). Quando um
pilar não possui nenhum KPI calculável (dados insuficientes), seu score deve
ser tratado como `null` e excluído do cálculo de `general_score`
(redistribuindo o peso proporcionalmente entre os pilares calculados).

---

# 3. Regras de Diagnóstico por Pilar

Cada regra abaixo gera um registro em `diagnostic_findings` quando sua
condição é verdadeira. `evidence` deve armazenar o valor calculado, o
threshold e o KPI de origem (formato sugerido em 3.6).

## 3.1 Pilar Comercial (`pillar = 'commercial'`)

### RULE-001 — Alto No-show

- **Condição:** `attendance_rate < 0.75`
- **Severidade:** `high`
- **Título:** "Alto índice de no-show"
- **Descrição:** "A taxa de comparecimento está abaixo de 75%, indicando
  perda relevante de agendamentos já confirmados."
- **Indicador:** 🔴

### RULE-002 — SLA de Resposta Crítico

- **Condição:** `average_response_time_minutes > 15`
- **Severidade:** `high`
- **Título:** "Tempo de resposta acima do SLA"
- **Descrição:** "O tempo médio de resposta a leads é superior a 15 minutos,
  reduzindo a taxa de conversão do funil comercial."
- **Indicador:** 🔴

## 3.2 Pilar Financeiro (`pillar = 'financial'`)

### RULE-003 — Rentabilidade Comprometida

- **Condição:** `net_margin < 0.10`
- **Severidade:** `critical`
- **Título:** "Margem líquida comprometida"
- **Descrição:** "A margem líquida está abaixo de 10%, indicando risco à
  sustentabilidade financeira da clínica."
- **Indicador:** 🔴

### RULE-004 — Estrutura de Folha Inchada

- **Condição:** `payroll_percentage > 0.40`
- **Severidade:** `medium`
- **Título:** "Folha de pagamento elevada em relação ao faturamento"
- **Descrição:** "A folha salarial consome mais de 40% do faturamento bruto,
  o que pode indicar estrutura de equipe desproporcional ao volume de
  receita."
- **Indicador:** 🟡

## 3.3 Pilar Retenção (`pillar = 'retention'`)

### RULE-006 — Baixa Renovação (proposta, não consta no PRD §8)

- **Condição:** `renewal_rate < 0.60`
- **Severidade:** `medium`
- **Título:** "Baixa taxa de renovação de pacientes elegíveis"
- **Descrição:** "Menos de 60% dos pacientes elegíveis estão renovando
  pacotes/tratamentos, sinalizando oportunidade de melhoria em retenção."
- **Indicador:** 🟡
- **Nota:** o PRD §8 não define uma regra explícita para `renewal_rate`.
  Esta regra é proposta para que o pilar Retenção (peso 20) tenha cobertura
  mínima no motor de diagnóstico. Pode ser ajustada/removida pelo consultor.

## 3.4 Pilar Marketing (`pillar = 'marketing'`)

### RULE-005 — Baixa Indicação/Ativação da Base

- **Condição:** `referral_rate < 0.10`
- **Severidade:** `medium`
- **Título:** "Baixa geração de indicações"
- **Descrição:** "Menos de 10% dos novos pacientes vieram por indicação,
  sugerindo baixa satisfação ou baixa ativação da base de pacientes."
- **Indicador:** 🟡

## 3.5 Pilar Operação (`pillar = 'operation'`)

### RULE-007 — Agenda Muito Distante

- **Condição:** `average_days_until_appointment > 10`
- **Severidade:** `high`
- **Título:** "Agenda muito distante"
- **Descrição:** "O tempo médio entre agendamento e consulta está acima do
  recomendado, aumentando o risco de esfriamento do lead, no-show e perda
  para concorrentes."
- **Indicador:** 🔴

### `operation_score` (benchmark dedicado)

`operation_score` é calculado diretamente a partir de
`average_days_until_appointment`, em **faixas fixas** (sem interpolação
linear entre os pontos, diferente da seção 2.4):

| `average_days_until_appointment` | `operation_score` |
| --- | ---: |
| `≤ 3 dias` | 100 |
| `4–7 dias` | 80 |
| `8–10 dias` | 60 |
| `> 10 dias` | 30 |

Implementação: `operationScoreFromAvgDaysUntilAppointment` em
`lib/kpis/scoring.ts`, chamada por `calculatePillarScores` (seção 2.5). A
faixa `> 10 dias` é consistente com o threshold de RULE-007 acima.

> **Nota (futuro, fora do MVP):** uma versão mais completa de
> `operation_score` poderia combinar `average_days_until_appointment` com
> produtividade da equipe (`clinic_team` + `total_team_time_minutes` de
> `product_metrics`). Não bloqueia o cálculo atual.

## 3.6 Formato sugerido para `evidence` (jsonb)

```json
{
  "kpi": "attendance_rate",
  "value": 0.68,
  "threshold": 0.75,
  "operator": "<",
  "unit": "percentage"
}
```

---

# 4. Severidade das Regras

| Regra | Pilar | Severidade | Indicador |
| --- | --- | --- | --- |
| RULE-001 — Alto no-show | commercial | `high` | 🔴 |
| RULE-002 — SLA crítico | commercial | `high` | 🔴 |
| RULE-003 — Rentabilidade comprometida | financial | `critical` | 🔴 |
| RULE-004 — Estrutura possivelmente inchada | financial | `medium` | 🟡 |
| RULE-005 — Baixa indicação/ativação | marketing | `medium` | 🟡 |
| RULE-006 — Baixa renovação (proposta) | retention | `medium` | 🟡 |
| RULE-007 — Agenda muito distante | operation | `high` | 🔴 |

Mapeamento severidade → peso numérico (usado no `priority_score`, seção 5):

| Severidade | `severity_weight` |
| --- | ---: |
| `low` | 1 |
| `medium` | 2 |
| `high` | 3 |
| `critical` | 4 |

---

# 5. Fórmula de `priority_score`

`priority_score` (coluna de `diagnostic_findings`, `numeric(6,2)`) ordena os
gargalos por urgência/impacto, combinando três fatores:

1. **Severidade da regra** (`severity_weight`, 1–4 — seção 4)
2. **Peso do pilar** (`pillar_weight`, 10–30 — seção 1.5, direto do PRD)
3. **Tamanho do desvio (`gap_ratio`)** — o quão distante o valor está do
   threshold da regra, normalizado em `[0, 1]`

```
gap_ratio =
  // regra do tipo "metric < threshold" (quanto menor, peor)
  clamp((threshold - value) / threshold, 0, 1)

  // regra do tipo "metric > threshold" (quanto maior, peor)
  clamp((value - threshold) / threshold, 0, 1)

priority_score = round(
  severity_weight * 10        // 10 .. 40
  + pillar_weight              // 10 .. 30
  + gap_ratio * 30              // 0  .. 30
)
```

**Faixa resultante:** 20 a 100.

### Exemplo

`attendance_rate = 0.60` (RULE-001, `pillar = commercial`, `severity = high`,
`threshold = 0.75`):

```
severity_weight = 3        →  3 * 10 = 30
pillar_weight   = 25        →            25
gap_ratio = (0.75 - 0.60) / 0.75 = 0.20  → 0.20 * 30 = 6

priority_score = 30 + 25 + 6 = 61
```

---

# 6. Mapeamento Gargalo → Plano de Ação Sugerido

Cada `diagnostic_finding` que dispara uma regra gera, automaticamente, um
`action_plan` com 3 fases padrão (Diagnóstico → Processo → Tecnologia),
seguindo o padrão definido no PRD §9 ("Projeto: Recuperação de No-show").
Cada fase do template gera `tasks` iniciais (status `todo`, prioridade
derivada da severidade da regra).

Mapeamento severidade → prioridade da tarefa:

| Severidade da regra | `priority` da task |
| --- | --- |
| `critical` | `urgent` |
| `high` | `high` |
| `medium` | `medium` |
| `low` | `low` |

## RULE-001 — Alto No-show → "Recuperação de No-show"

- **objective:** "Reduzir a taxa de no-show para acima de 75%."
- **expected_result:** "`attendance_rate ≥ 0.75` no próximo diagnóstico."
- **Fase 1 — Diagnóstico:** Levantar motivos de não comparecimento; Analisar
  `average_days_until_appointment`.
- **Fase 2 — Processo:** Criar régua de confirmação (lembretes); Definir SLA
  de contato pré-consulta.
- **Fase 3 — Tecnologia:** Implantar CRM de agendamento; Implantar
  automações de confirmação (WhatsApp/SMS).
- **expected_kpi (tasks):** `attendance_rate`

## RULE-002 — SLA de Resposta Crítico → "Aceleração do Atendimento Comercial"

- **objective:** "Reduzir o tempo médio de resposta a leads para até 15
  minutos."
- **expected_result:** "`average_response_time_minutes ≤ 15`."
- **Fase 1 — Diagnóstico:** Mapear horários/canais com maior atraso de
  resposta; Levantar volume de leads por canal.
- **Fase 2 — Processo:** Definir SLA de primeira resposta por canal;
  Redistribuir escala da equipe comercial conforme pico de leads.
- **Fase 3 — Tecnologia:** Implantar respostas automáticas/chatbot inicial;
  Implantar alertas de SLA no CRM.
- **expected_kpi (tasks):** `average_response_time_minutes`

## RULE-003 — Rentabilidade Comprometida → "Recuperação de Margem"

- **objective:** "Elevar a margem líquida para acima de 10%."
- **expected_result:** "`net_margin ≥ 0.10`."
- **Fase 1 — Diagnóstico:** Detalhar composição de custos e despesas
  (`direct_costs`, `operational_expenses`, `other_expenses`); Identificar
  produtos/serviços com `product_margin` negativa.
- **Fase 2 — Processo:** Renegociar contratos com maiores custos diretos;
  Revisar política de preços/ticket médio.
- **Fase 3 — Tecnologia:** Implantar dashboard financeiro mensal; Implantar
  controle de custos por produto.
- **expected_kpi (tasks):** `net_margin`

## RULE-004 — Estrutura de Folha Inchada → "Otimização da Estrutura de Equipe"

- **objective:** "Reduzir `payroll_percentage` para 35% ou menos."
- **expected_result:** "`payroll_percentage ≤ 0.35`."
- **Fase 1 — Diagnóstico:** Mapear `clinic_team` vs. volume de
  atendimentos/receita; Identificar funções com ociosidade.
- **Fase 2 — Processo:** Redefinir escalas e metas de produtividade por
  função; Avaliar política de comissionamento.
- **Fase 3 — Tecnologia:** Implantar sistema de gestão de escalas/produtividade.
- **expected_kpi (tasks):** `payroll_percentage`

## RULE-005 — Baixa Indicação/Ativação → "Programa de Indicação e Ativação"

- **objective:** "Elevar `referral_rate` para 10% ou mais."
- **expected_result:** "`referral_rate ≥ 0.10`."
- **Fase 1 — Diagnóstico:** Avaliar NPS/satisfação dos pacientes ativos;
  Mapear pontos de contato pós-venda.
- **Fase 2 — Processo:** Criar programa formal de indicação (incentivos);
  Definir régua de relacionamento pós-consulta.
- **Fase 3 — Tecnologia:** Implantar automação de pesquisa de satisfação;
  Implantar tracking de origem do paciente (indicação).
- **expected_kpi (tasks):** `referral_rate`

## RULE-006 — Baixa Renovação → "Programa de Retenção e Renovação"

- **objective:** "Elevar `renewal_rate` para 60% ou mais."
- **expected_result:** "`renewal_rate ≥ 0.60`."
- **Fase 1 — Diagnóstico:** Levantar motivos de não renovação (saída de
  pacientes elegíveis); Segmentar pacientes elegíveis por tempo desde a
  última compra.
- **Fase 2 — Processo:** Criar régua de renovação (pré-vencimento);
  Definir oferta/condição padrão de renovação.
- **Fase 3 — Tecnologia:** Implantar automação de régua de renovação;
  Implantar alerta de pacientes elegíveis próximos do vencimento.
- **expected_kpi (tasks):** `renewal_rate`

---

# 7. Resumo de Implementação (`lib/kpis/`)

| Módulo | Responsabilidade |
| --- | --- |
| `types.ts` | Tipos de entrada/saída para todos os domínios de KPI |
| `commercial.ts` | `calculateCommercialKpis()` — seção 1.1 |
| `financial.ts` | `calculateFinancialKpis()` — seção 1.2 |
| `products.ts` | `calculateProductKpis()`, `rankProducts()` — seção 1.3 |
| `benchmarks.ts` | Tabelas da seção 2 + `scoreFromBenchmark()`, `getKpiStatus()` |
| `scoring.ts` | `calculatePillarScores()`, `calculateGeneralScore()` (seção 1.4/1.5), `calculatePriorityScore()` (seção 5) |
| `index.ts` | Barrel export |

A geração de `diagnostic_findings` e `action_plans` (seções 3 e 6) é o
**motor de regras**, que consome a camada de KPIs mas é implementado
separadamente (fora do escopo desta primeira entrega de `lib/kpis/`).

---

# 8. Score de Maturidade

A partir do `general_score` (seção 1.4), o sistema classifica a clínica em um
dos 4 níveis de maturidade executiva — uma camada de apresentação que
reutiliza as mesmas faixas da seção 1.6, traduzindo o score numérico em uma
classificação de negócio compreensível para o cliente final.

Implementado em `lib/diagnostics/maturity.ts` — `getMaturityLevel(generalScore)`.
Retorna `null` quando `general_score` é `null` (diagnóstico ainda não gerado).

## 8.1 Níveis

| Score | Nível (`label`) | `status` | Foco recomendado (`recommended_focus`) |
| --- | --- | --- | --- |
| 0–39 | Clínica em risco | `critico` | Estabilizar a operação: priorizar os planos de ação de severidade crítica/alta para reverter os indicadores antes de investir em crescimento. |
| 40–59 | Clínica desorganizada | `atencao` | Estruturar e padronizar os processos comerciais, financeiros e de atendimento antes de acelerar o crescimento. |
| 60–79 | Clínica estruturada | `bom` | Reforçar os pilares com desempenho abaixo da média e preparar a operação para crescer com previsibilidade. |
| 80–100 | Clínica escalável | `excelente` | Investir em expansão (novas unidades, produtos ou canais de aquisição), mantendo o monitoramento contínuo dos indicadores. |

Cada nível também retorna uma `description` (1 frase) com o diagnóstico
executivo do estágio atual da clínica.

## 8.2 Formato de retorno

```ts
interface MaturityLevel {
  label: string;
  description: string;
  recommended_focus: string;
  status: 'critico' | 'atencao' | 'bom' | 'excelente';
}
```

`status` reutiliza a mesma taxonomia de `getKpiStatus()` (seção 1.6), permitindo
reaproveitar as cores/badges já usados para os scores por pilar.

## 8.3 Onde é exibido

- `app/(app)/diagnostics/[id]/page.tsx` — card "Nível de maturidade" logo após
  o score geral.
- `app/(app)/diagnostics/[id]/report/page.tsx` — mesmo card no relatório
  executivo (incluído na impressão).
- `lib/diagnostics/summary.ts` — `buildExecutiveSummary()` adiciona um
  parágrafo com o nível de maturidade, sua descrição e o foco recomendado ao
  `executive_summary` gerado junto com o diagnóstico.
