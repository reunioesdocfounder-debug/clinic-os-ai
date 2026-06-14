# NO_AI_RULES_SYSTEM.md — Motor Especialista (Regras + Templates), sem IA Generativa

## 0. Contexto

Este documento é uma **proposta técnica** (sem implementação ainda) para
estruturar o motor de diagnóstico e planos de ação do ClinicOS como um
**motor especialista 100% determinístico** — regras de negócio + templates de
texto/plano — sem depender de IA generativa.

### 0.1 Diagnóstico da arquitetura atual

Boa notícia: **o sistema já não usa IA generativa em nenhum ponto**. Toda a
lógica de diagnóstico, score e plano de ação é regra/template, implementada
em TypeScript:

| Camada | Arquivo | O que faz hoje |
| --- | --- | --- |
| KPIs (fórmulas puras) | `lib/kpis/commercial.ts`, `financial.ts`, `products.ts` | Calculam taxas/margens a partir das métricas brutas (`commercial_metrics`, `financial_metrics`, `product_metrics`). |
| Benchmarks → score 0-100 | `lib/kpis/benchmarks.ts` (`KPI_BENCHMARKS`) | Tabela hardcoded de pontos de ancoragem por KPI, com interpolação linear (`scoreFromBenchmark`). |
| Score por pilar / geral / prioridade | `lib/kpis/scoring.ts` | `PILLAR_WEIGHTS`, `SEVERITY_WEIGHTS` e o **mapeamento KPI → pilar hardcoded dentro de `calculatePillarScores`**. |
| Regras de diagnóstico | `lib/diagnostics/findings.ts` (`generateFindings`) | **6 blocos `if` hardcoded** (RULE-001 a RULE-006), cada um com sua própria condição, textos de título/descrição/impacto e cálculo de evidência. |
| Planos de ação | `lib/diagnostics/action-plan-generator.ts` (`ACTION_PLAN_TEMPLATES`) | Record hardcoded **indexado pelo `title` exato do finding** (string), cada entrada com 3 fases fixas e listas de tarefas fixas. |
| Resumo executivo | `lib/diagnostics/summary.ts` | Monta texto a partir de scores + findings, também por template de string. |
| Orquestração | `lib/diagnostics/build-diagnostic.ts` | Carrega métricas → calcula KPIs/scores → chama `generateFindings` → monta resumo. |
| Persistência | `app/(app)/diagnostics/[id]/actions.ts`, `.../action-plans/actions.ts` | Server Actions que apagam e reinserem `diagnostic_findings` / `action_plans` + `action_plan_phases` + `tasks`. |

### 0.2 Por que isso não é "sem IA" o suficiente

O motor já é determinístico, mas **não é uma biblioteca estruturada** — é
código imperativo onde regra, texto e template estão entrelaçados. Os
problemas concretos para a meta de extensibilidade (item 3 do pedido):

1. **Acoplamento por string frágil**: `ACTION_PLAN_TEMPLATES` é indexado pelo
   `title` do finding (`'Alto índice de no-show': {...}`). Se o texto do
   título mudar em `findings.ts`, o plano correspondente deixa de ser
   encontrado **silenciosamente** (o `.filter((plan) => plan !== null)` apenas
   descarta).
2. **Mapeamento KPI → pilar duplicado e implícito**: `calculatePillarScores`
   decide manualmente quais KPIs entram em `commercial_score`,
   `financial_score`, etc. Adicionar um KPI a um pilar exige editar essa
   função, além de `KPI_BENCHMARKS` e, possivelmente, uma nova regra.
3. **Toda regra nova = novo bloco de código**: cada regra em `findings.ts`
   mistura (a) a condição, (b) o texto em PT-BR de título/descrição, (c) o
   cálculo de `evidence`, e (d) um cálculo de impacto de negócio específico
   (ex.: "quantos atendimentos adicionais isso representa"). Não há como
   adicionar uma regra "simples" sem tocar nessa função.
4. **Planos de ação = 3 fases fixas, sem reuso**: cada plano define suas
   próprias 9 tarefas (3 fases × 3 tarefas) inline. Não há biblioteca de
   fases/tarefas reutilizáveis entre planos.

A proposta abaixo resolve os 4 pontos **mantendo o comportamento atual
idêntico** (mesmas 6 regras, mesmos 6 planos, mesmos textos) — é uma
refatoração estrutural, não uma reescrita de regras de negócio.

---

## 1. Biblioteca estruturada de regras de diagnóstico

### 1.1 Registro único de KPIs (`KPI_DEFINITIONS`)

Hoje, um KPI tem metadados espalhados em 2 lugares: `KPI_BENCHMARKS`
(`lib/kpis/benchmarks.ts`) e o mapeamento implícito de pilar em
`calculatePillarScores` (`lib/kpis/scoring.ts`). Proposta: unificar em um
único registro, em `lib/rules-engine/kpi-definitions.ts`:

```ts
export interface KpiDefinition {
  key: string;                 // 'attendance_rate'
  label: string;               // 'Taxa de Comparecimento' (PT-BR, p/ resumo executivo)
  unit: 'percentage' | 'minutes' | 'days' | 'ratio';
  /** Pilar(es) cujo score deve incluir este KPI. Ausente = KPI informativo (não entra em nenhum score). */
  pillars?: Pillar[];
  benchmark: KpiBenchmark;      // mesma forma de hoje (direction + points)
}

export const KPI_DEFINITIONS: Record<string, KpiDefinition> = {
  attendance_rate: {
    key: 'attendance_rate',
    label: 'Taxa de Comparecimento',
    unit: 'percentage',
    pillars: ['commercial'],
    benchmark: { direction: 'up', points: [...] }, // valores idênticos aos atuais
  },
  // ...demais KPIs, idênticos aos hoje presentes em KPI_BENCHMARKS
};
```

`calculatePillarScores` passa a ser **genérico**:

```ts
function calculatePillarScores(facts: FactsTable): PillarScores {
  for (const pillar of PILLARS) {
    const scores = Object.values(KPI_DEFINITIONS)
      .filter((kpi) => kpi.pillars?.includes(pillar))
      .map((kpi) => scoreFromBenchmark(facts[kpi.key], kpi.key));
    result[pillar] = average(scores);
  }
}
```

**Resultado**: adicionar um KPI a um pilar (ou criar um novo pilar de
"operação") passa a ser **uma edição de dados** em `KPI_DEFINITIONS` — zero
mudança em `scoring.ts`.

### 1.2 Tabela de fatos (`FactsTable`)

As regras hoje leem de 4 fontes diferentes (`commercialKpis`,
`financialKpis`, `commercialInput`, `financialInput`). Proposta: o
orquestrador (`build-diagnostic.ts`) monta uma **tabela de fatos plana**
antes de chamar o motor de regras:

```ts
type FactsTable = Record<string, number | null>;

function buildFactsTable(ctx: {
  commercialKpis: CommercialKpis;
  financialKpis: FinancialKpis;
  commercialInput: CommercialMetricsInput;
  financialInput: FinancialMetricsInput;
}): FactsTable {
  return {
    ...ctx.commercialKpis,
    ...ctx.financialKpis,
    average_response_time_minutes: ctx.commercialInput.average_response_time_minutes,
    average_days_until_appointment: ctx.commercialInput.average_days_until_appointment,
    // demais campos brutos referenciados por regras/benchmarks
  };
}
```

Isso desacopla as regras de "de qual objeto TS vem o valor" — uma regra só
referencia uma **chave de fato** (`metric: 'attendance_rate'`), que pode vir
de um KPI calculado ou de um campo bruto, sem diferença para o motor.

### 1.3 Registro declarativo de regras (`RULE_DEFINITIONS`)

Em `lib/rules-engine/rules.ts`:

```ts
export interface RuleDefinition {
  id: string;                  // 'RULE-001' — chave estável, usada por action plans
  pillar: Pillar;
  severity: Severity;
  metric: string;               // chave em FactsTable, ex.: 'attendance_rate'
  operator: '<' | '>';
  threshold: number;
  title: string;                 // texto fixo (PT-BR)
  descriptionTemplate: string;   // pode usar {{value}}, {{threshold}}, {{gap}}
  impactTemplate: string;        // pode usar variáveis genéricas + as retornadas pelo impactCalculator
  impactCalculator?: ImpactCalculatorKey; // opcional — Tier 2, ver 1.4
}

export const RULE_DEFINITIONS: RuleDefinition[] = [
  {
    id: 'RULE-001',
    pillar: 'commercial',
    severity: 'high',
    metric: 'attendance_rate',
    operator: '<',
    threshold: 0.75,
    title: 'Alto índice de no-show',
    descriptionTemplate:
      'A taxa de comparecimento está abaixo de {{thresholdPercent}}, indicando perda relevante ' +
      'de agendamentos já confirmados.',
    impactTemplate:
      'Elevar a taxa de comparecimento para {{thresholdPercent}} representaria aproximadamente ' +
      '{{additionalAttendances}} atendimento(s) adicional(is) no período, equivalentes a ' +
      '{{potentialRevenue}} em receita potencial com base no ticket médio.',
    impactCalculator: 'attendanceRecoveryRevenue',
  },
  // RULE-002 .. RULE-006, mesma estrutura, textos idênticos aos atuais
];
```

### 1.4 Motor de avaliação genérico (`evaluator.ts`)

```ts
export function evaluateRules(facts: FactsTable, rawInputs: RawInputs): FindingDraft[] {
  return RULE_DEFINITIONS.flatMap((rule) => {
    const value = facts[rule.metric];
    if (value === null || !conditionMatches(value, rule.operator, rule.threshold)) return [];

    const baseVars = buildBaseTemplateVars(value, rule.threshold, rule.operator); // {{value}}, {{threshold}}, {{gap}}, {{thresholdPercent}}...
    const extraVars = rule.impactCalculator
      ? IMPACT_CALCULATORS[rule.impactCalculator](facts, rawInputs, rule)
      : {};

    return [{
      pillar: rule.pillar,
      severity: rule.severity,
      title: rule.title,
      description: render(rule.descriptionTemplate, baseVars),
      estimated_impact: render(rule.impactTemplate, { ...baseVars, ...extraVars }),
      evidence: { kpi: rule.metric, value: roundTo(value, 4), threshold: rule.threshold, operator: rule.operator, unit: KPI_DEFINITIONS[rule.metric]?.unit },
      priority_score: calculatePriorityScore({ severity: rule.severity, pillar: rule.pillar, value, threshold: rule.threshold, operator: rule.operator }),
      rule_id: rule.id, // NOVO campo — ver secao 3.2
    }];
  });
}
```

`calculatePriorityScore` (lib/kpis/scoring.ts) **não muda** — já é
genérica.

### 1.5 "Tiers" de regra — quanto código uma regra nova exige

| Tier | Quando usar | O que é preciso adicionar |
| --- | --- | --- |
| **Tier 1 — zero código** | Regra simples, sem narrativa de impacto financeiro específica (ex.: "X está fora da faixa recomendada"). | 1 entrada em `RULE_DEFINITIONS`, sem `impactCalculator` — `impactTemplate` usa só `{{value}}`/`{{threshold}}`/`{{gap}}` (genéricos, sempre disponíveis). |
| **Tier 2 — 1 função pequena** | Regra precisa de uma narrativa de impacto de negócio (ex.: "representa X indicações adicionais / R$ Y de receita"), usando campos brutos além de `value`/`threshold`. | 1 entrada em `RULE_DEFINITIONS` **+** 1 função pura em `lib/rules-engine/impact-calculators.ts`, registrada por chave (`IMPACT_CALCULATORS['minhaNovaChave']`). |

As 6 regras atuais são todas Tier 2 (cada uma tem uma narrativa de impacto
específica) — a migração extrai exatamente essas 6 funções de
`findings.ts` para `impact-calculators.ts`, sem alterar a lógica.

---

## 2. Templates reutilizáveis de planos de ação

### 2.1 Vínculo por `rule_id`, não por texto

Hoje: `ACTION_PLAN_TEMPLATES['Alto índice de no-show']`. Proposta:
`ACTION_PLAN_TEMPLATES` é uma lista, cada item referencia `ruleId: 'RULE-001'`:

```ts
// lib/rules-engine/action-plan-templates.ts
export interface TaskTemplate {
  title: string;
}

export interface PhaseTemplate {
  title: string;
  orderIndex: number;
  tasks: TaskTemplate[];
}

export interface ActionPlanTemplate {
  id: string;             // 'PLAN-001'
  ruleId: string;          // 'RULE-001' — FK lógica para RULE_DEFINITIONS
  title: string;
  description: string;
  objective: string;
  expectedResult: string;
  expectedKpi: string;
  phases: PhaseTemplate[];
}

export const ACTION_PLAN_TEMPLATES: ActionPlanTemplate[] = [
  {
    id: 'PLAN-001',
    ruleId: 'RULE-001',
    title: 'Recuperação de No-show',
    description: 'Plano para reduzir o índice de no-show e recuperar agendamentos confirmados.',
    objective: 'Reduzir a taxa de no-show para acima de 75%.',
    expectedResult: 'attendance_rate ≥ 0.75 no próximo diagnóstico.',
    expectedKpi: 'attendance_rate',
    phases: [
      { title: 'Fase 1 — Diagnóstico', orderIndex: 1, tasks: [
        { title: 'Levantar motivos de não comparecimento' },
        { title: 'Analisar average_days_until_appointment' },
      ]},
      { title: 'Fase 2 — Processo', orderIndex: 2, tasks: [...] },
      { title: 'Fase 3 — Tecnologia/Automação', orderIndex: 3, tasks: [...] },
    ],
  },
  // PLAN-002 .. PLAN-006, mesmo conteúdo de hoje
];
```

### 2.2 Geração por `rule_id`

```ts
export function generateActionPlans(findings: { rule_id: string; severity: Severity }[]): ActionPlanDraft[] {
  return findings
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .flatMap((finding) => {
      const template = ACTION_PLAN_TEMPLATES.find((t) => t.ruleId === finding.rule_id);
      if (!template) return [];
      const priority = SEVERITY_TO_TASK_PRIORITY[finding.severity];
      return [{
        title: template.title,
        description: template.description,
        objective: template.objective,
        expected_result: template.expectedResult,
        phases: template.phases.map((phase) => ({
          title: phase.title,
          order_index: phase.orderIndex,
          tasks: phase.tasks.map((task) => ({ title: task.title, priority, expected_kpi: template.expectedKpi })),
        })),
      }];
    });
}
```

### 2.3 Biblioteca de fases/tarefas reutilizáveis (futuro, não no MVP da refatoração)

Hoje cada plano define 9 tarefas inline, com pouca repetição entre planos —
**não vale a pena** introduzir uma biblioteca de "task templates"
compartilhados agora (over-engineering). Se, ao adicionar novas regras
(RULE-007+), surgirem tarefas literalmente repetidas entre planos (ex.:
"Implantar dashboard financeiro mensal" aparecendo em 3 planos diferentes),
aí sim vale extrair um `TASK_LIBRARY: Record<string, TaskTemplate>` e
referenciar por chave. Deixar essa extração para quando houver duplicação
real (regra do "três strings iguais").

---

## 3. Extensibilidade — adicionando itens sem alterar o motor

Com a estrutura das seções 1 e 2, o "motor" (`evaluator.ts`,
`plan-generator.ts`, `scoring.ts`) **não muda mais** ao adicionar:

| Para adicionar... | Edite (dados) | Código novo? |
| --- | --- | --- |
| Um novo KPI com benchmark (sem virar regra) | 1 entrada em `KPI_DEFINITIONS` | Não |
| Um KPI existente passa a contar para um pilar | campo `pillars` em `KPI_DEFINITIONS` | Não |
| Uma regra simples (Tier 1) | 1 entrada em `RULE_DEFINITIONS` | Não |
| Uma regra com narrativa de impacto (Tier 2) | 1 entrada em `RULE_DEFINITIONS` | +1 função em `impact-calculators.ts` |
| Um plano de ação para uma regra existente/nova | 1 entrada em `ACTION_PLAN_TEMPLATES` (`ruleId`) | Não |
| Fases/tarefas de um plano | array `phases`/`tasks` dentro do template | Não |
| Novo pilar (ex.: "Operação" com regra real) | `Pillar` em `database.types.ts` (enum/check constraint) + entradas em `KPI_DEFINITIONS`/`PILLAR_WEIGHTS`/`RULE_DEFINITIONS` | Pequena migration SQL (check constraint) |

### 3.1 Checklist "Como adicionar a Regra RULE-007" (exemplo documentado)

Esta checklist vira a seção final de `docs/RULES_ENGINE.md` após a
refatoração:

1. Definir `metric`, `operator`, `threshold`, `pillar`, `severity`.
2. Se `metric` ainda não existe em `KPI_DEFINITIONS`, adicionar (com
   `benchmark.points` e `unit`).
3. Adicionar entrada em `RULE_DEFINITIONS` com `id`, textos PT-BR
   (`title`, `descriptionTemplate`, `impactTemplate`).
4. (Opcional, Tier 2) Implementar e registrar `impactCalculator`.
5. (Opcional) Adicionar `ActionPlanTemplate` com `ruleId` correspondente.
6. Rodar `npm test` (testes de regra, seção 5.2) e regenerar um
   diagnóstico de exemplo para validar texto/score.

### 3.2 Mudança de schema necessária: `diagnostic_findings.rule_id`

Para o vínculo por `rule_id` (seção 2.1) funcionar, `diagnostic_findings`
precisa de uma coluna nova:

```sql
alter table public.diagnostic_findings
  add column rule_id text;
```

- Nullable, sem `not null` (não quebra linhas existentes).
- `generateDiagnostic` (que já faz delete+reinsert idempotente) passa a
  popular `rule_id` automaticamente na próxima geração.
- Findings antigos (sem `rule_id`) simplesmente não geram plano de ação até
  o diagnóstico ser regerado — comportamento aceitável dado que "Gerar
  diagnóstico" e "Gerar planos de ação" já são ações explícitas do usuário.

---

## 4. Código vs. tabelas no Supabase

### 4.1 Recomendação: **manter em código (módulos TS) por enquanto**

Razões:

- **Volume e cadência de mudança baixos**: 6 regras, 6 planos, ~13 KPIs.
  Adicionar uma regra nova é um evento raro (semanas/meses), não uma
  operação do dia a dia de um usuário final.
- **Quem edita é o time técnico**: não há, hoje, um "consultor não-dev" que
  precise editar regras sem deploy. O usuário do sistema (clínica) não
  configura regras.
- **Tipagem e testes**: definições em TS são checadas em tempo de
  compilação (`tsc`) e testáveis com `vitest`/`jest` diretamente — uma
  tabela em `jsonb` exigiria validação em runtime (zod) para o mesmo
  benefício.
- **Auditoria via Git**: histórico de mudança de regra de negócio (quem
  mudou o threshold de `attendance_rate` e quando/por quê) já vem "de
  graça" pelo `git log`/`git blame` — replicar isso em tabela exigiria
  tabela de auditoria própria.
- **Sem necessidade de customização por clínica/tenant**: as regras hoje
  são globais (mesmo motor para todas as clínicas). Banco de dados só
  ganha vantagem clara quando há **variação por tenant**.

### 4.2 Como deixar a porta aberta para Supabase (sem pagar o custo agora)

Introduzir uma camada de **repositório** (`lib/rules-engine/repository.ts`)
que hoje apenas retorna as constantes TS:

```ts
export async function getKpiDefinitions(): Promise<KpiDefinition[]> {
  return Object.values(KPI_DEFINITIONS);
}
export async function getRuleDefinitions(): Promise<RuleDefinition[]> {
  return RULE_DEFINITIONS;
}
export async function getActionPlanTemplates(): Promise<ActionPlanTemplate[]> {
  return ACTION_PLAN_TEMPLATES;
}
```

`evaluator.ts` e `plan-generator.ts` **só conversam com o repositório**,
nunca importam as constantes diretamente. Como as interfaces
(`KpiDefinition`, `RuleDefinition`, `ActionPlanTemplate`) já são
JSON-serializáveis (sem funções, exceto a referência por *chave* ao
`impactCalculator`), migrar para Supabase no futuro é:

1. Criar tabelas `rule_definitions`, `kpi_definitions`,
   `action_plan_templates` (colunas espelhando os campos das interfaces,
   `phases`/`tasks`/`benchmark.points` como `jsonb`).
2. Seed a partir das constantes TS atuais (`INSERT ... SELECT` a partir de
   um script único de migração).
3. Trocar a implementação de `repository.ts` para consultar Supabase (com
   cache em memória + `revalidateTag`, já que regras mudam raramente).
4. **Nenhuma mudança** em `evaluator.ts`, `plan-generator.ts`,
   `scoring.ts`.

### 4.3 Gatilhos que justificariam migrar para Supabase

Reavaliar quando **qualquer um** destes ocorrer:

- Necessidade de um consultor/admin editar regras via UI, sem deploy.
- Regras/benchmarks diferentes por clínica, plano comercial ou setor
  (ex.: estética vs. odontologia).
- Necessidade de versionar conjuntos de regras (ex.: "regras v2 a partir de
  01/2027") e aplicar a diagnósticos retroativamente de forma controlada.
- Volume de regras crescer a ponto de o arquivo TS ficar difícil de revisar
  (> ~30-40 regras).

---

## 5. Roadmap de implementação em fases

### Fase 1 — Extração estrutural (sem mudança de comportamento)

- Criar `lib/rules-engine/` com `kpi-definitions.ts`, `rules.ts`,
  `action-plan-templates.ts`, `impact-calculators.ts`, `templates.ts`
  (interpolação `{{var}}`), `evaluator.ts`, `plan-generator.ts`,
  `repository.ts`.
- Migrar as 6 regras de `lib/diagnostics/findings.ts` e os 6 planos de
  `lib/diagnostics/action-plan-generator.ts` 1:1 para o novo formato
  declarativo — **textos e valores idênticos**.
- Generalizar `calculatePillarScores` (lib/kpis/scoring.ts) para usar
  `KPI_DEFINITIONS` em vez do mapeamento hardcoded.
- Migration: `alter table diagnostic_findings add column rule_id text;`
  + popular `rule_id` no `evaluator.ts`.
- Atualizar `build-diagnostic.ts` (monta `FactsTable`) e os Server Actions
  (`.../actions.ts`, `.../action-plans/actions.ts`) para os novos pontos de
  entrada.
- **Critério de aceite**: para um conjunto de diagnósticos de teste, os
  `diagnostic_findings` e `action_plans`/`phases`/`tasks` gerados são
  **idênticos byte-a-byte** (exceto pelo novo campo `rule_id`) aos gerados
  pelo código atual.

### Fase 2 — Testes e documentação

- Testes unitários por regra: condição (limite exato, abaixo, acima),
  `evidence`, `priority_score`, textos renderizados.
- Teste de geração de plano: cada `RULE_DEFINITIONS` de severidade
  `critical`/`high` tem um `ACTION_PLAN_TEMPLATES` correspondente
  (`ruleId`) — teste de integridade referencial em build/CI.
- Atualizar `docs/RULES_ENGINE.md`: seção "Como adicionar uma regra" (3.1),
  apontando para os novos arquivos.

### Fase 3 — Validar extensibilidade com regra(s) nova(s)

- Adicionar **RULE-007** (pilar Operação — ex.: produtividade da equipe
  usando `clinic_team` + `total_team_time_minutes`, conforme nota da seção
  3.5 de `docs/RULES_ENGINE.md`) usando **apenas** o fluxo da seção 3.1.
- Validar que nenhum arquivo do "motor" (`evaluator.ts`, `scoring.ts`,
  `plan-generator.ts`) precisou ser tocado — só dados + 1 calculador de
  impacto (Tier 2) se necessário.

### Fase 4 — (Condicional) Migração para Supabase

Só executar se um dos gatilhos da seção 4.3 ocorrer:

- Tabelas `kpi_definitions`, `rule_definitions`, `action_plan_templates`
  (+ `_phases`/`_tasks` ou `jsonb`).
- Seed a partir dos módulos TS da Fase 1.
- `repository.ts` passa a consultar Supabase com cache.
- (Opcional) UI administrativa de regras, reaproveitando os primitivos de
  design (`Card`, `Badge`, `Table`) já existentes em `components/ui/`.

---

## 6. Resumo das mudanças propostas (sem implementar)

- **Novo módulo** `lib/rules-engine/` (KPIs+benchmarks unificados, regras
  declarativas, templates de plano, calculadores de impacto, motor
  genérico).
- **Refatoração** de `lib/kpis/scoring.ts` (`calculatePillarScores`
  genérico via `KPI_DEFINITIONS`).
- **Substituição** de `lib/diagnostics/findings.ts` e
  `lib/diagnostics/action-plan-generator.ts` pelo novo motor (mesmo
  comportamento).
- **1 migration SQL** pequena: `diagnostic_findings.rule_id text`.
- **Sem novas tabelas Supabase** nesta fase — porta aberta via
  `repository.ts` para o futuro (seção 4.2).
- **Atualização de `docs/RULES_ENGINE.md`** com o novo formato declarativo
  e guia "como adicionar uma regra".
