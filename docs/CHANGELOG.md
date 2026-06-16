# CHANGELOG — ClinicOS AI

Histórico de versões do sistema. Versões seguem [Semantic Versioning](https://semver.org/lang/pt-BR/):
`MAJOR.MINOR.PATCH` — incrementos de `MINOR` adicionam funcionalidade de forma retrocompatível; `MAJOR` indica
mudanças de contrato (schema, API pública, modelo de dados).

---

## v1.1.0 — 2026-06-16

Ciclo de análise histórica e inteligência executiva — sem IA generativa.

### Funcionalidades adicionadas

- **Score de Maturidade** (`lib/diagnostics/maturity.ts`) — classifica a clínica em 4 níveis executivos
  derivados deterministicamente do `general_score`: _Clínica em risco_ (0–39), _Clínica desorganizada_
  (40–59), _Clínica estruturada_ (60–79) e _Clínica escalável_ (80–100). Exibido no dashboard do
  diagnóstico e no relatório executivo.

- **Histórico da clínica** (`/clinics/[id]/history`) — lista todos os diagnósticos de uma clínica
  ordenados por período (mais recente primeiro), com score e badge de classificação. Link "Ver histórico"
  adicionado à página de detalhe da clínica.

- **Comparação entre diagnósticos** (`/diagnostics/[id]/compare` + `lib/diagnostics/comparison.ts`) —
  tabela comparativa entre o diagnóstico atual e o anterior da mesma clínica. Exibe valor anterior,
  valor atual, diferença absoluta e variação percentual para 12 métricas (scores por pilar, receita
  bruta, lucro líquido, margem líquida, comparecimento, conversão e renovação). Acessível via botão
  "Comparar 2 diagnósticos mais recentes" no histórico.

- **Prioridades do próximo ciclo** (`lib/diagnostics/next-cycle.ts`) — os 3 achados de maior
  `priority_score` são traduzidos em recomendações estruturadas (foco, motivo, ação sugerida, KPI a
  acompanhar) via templates determinísticos indexados por `rule_id`. Exibido no dashboard e no
  relatório executivo.

- **Comparação histórica no relatório executivo** — quando existe diagnóstico anterior da mesma
  clínica, o relatório exibe seção "Evolução em relação ao ciclo anterior" com tabela de 9 métricas
  (3 scores + 3 financeiras + 3 comerciais), indicadores ↑/↓ coloridos e variação percentual.
  Compatível com impressão (`print-avoid-break`).

### Melhorias

- Textos dos templates de planos de ação (`lib/rules-engine/action-plan-templates.ts`) reescritos em
  PT-BR de negócio: nomes de campos técnicos como `attendance_rate`, `direct_costs`, `clinic_team`
  substituídos por linguagem compreensível para o usuário final.
- Badge "KPI: {chave_técnica}" nas páginas de planos de ação substituído por "Indicador: {label PT-BR}"
  via mapeamento em `KPI_DEFINITIONS`.

---

## v1.0.0 — 2026-06-13

MVP — Motor de diagnóstico clínico sem IA generativa.

### Funcionalidades

- **Autenticação** — login por e-mail/senha via Supabase Auth; middleware de sessão com redirecionamento
  para `/login`; callback OAuth em `/auth/callback`; proteção dupla (middleware + layout).

- **Clínicas** — CRUD completo (criar, visualizar, editar); campos: nome, cidade, estado, modelo de
  negócio, anos de operação, especialidades.

- **Produtos/serviços** — cadastro de produtos com preço médio, custo direto por unidade, comissão por
  unidade e tempo de equipe. Usados no cálculo de métricas por produto.

- **Diagnósticos** — criação por clínica e período (mês/ano); status `draft` → `completed`; dashboard
  executivo com score geral, scores por pilar e resumo executivo gerado automaticamente.

- **Métricas comerciais** — formulário de entrada: leads, leads contactados, agendamentos, comparecimentos,
  vendas, renovações, indicações, tempo médio de resposta, tempo médio até a consulta.

- **Métricas financeiras** — formulário de entrada: receita bruta, impostos, custos diretos, folha de
  pagamento, marketing, comissões, despesas operacionais, despesas financeiras, outras despesas.
  Cálculo automático de receita líquida, lucro bruto, EBITDA, lucro líquido, margem líquida e
  percentual de folha.

- **Métricas por produto** — entrada de quantidade vendida, preço médio, custo direto e tempo de
  equipe por produto; cálculo de receita, margem e ranking de produtos.

- **Motor de KPIs** (`lib/kpis/`) — cálculo de todos os KPIs derivados (comerciais, financeiros,
  por produto) com interpolação linear de benchmarks para scores 0–100.

- **Motor de regras sem IA** (`lib/rules-engine/`) — 7 regras declarativas (RULE-001..RULE-007)
  avaliadas deterministicamente contra os KPIs; cada regra define pilar, severidade, threshold e
  calculador de impacto. Nenhuma chamada a LLM.

- **Achados** (`diagnostic_findings`) — gerados automaticamente ao acionar "Gerar diagnóstico";
  incluem título, descrição, severidade, pilar, impacto estimado e `priority_score` (0–100).

- **Planos de ação** (`action_plans` + `action_plan_phases` + `tasks`) — gerados automaticamente
  para achados de severidade `critical` ou `high`; estrutura em 3 fases (diagnóstico → processo →
  tecnologia/automação) com tarefas priorizadas.

- **Roadmap 30/60/90 dias** (`/diagnostics/[id]/roadmap`) — distribuição das tarefas dos planos de
  ação em janelas de 30, 60 e 90 dias ordenadas por `priority_score`.

- **Relatório executivo print-friendly** (`/diagnostics/[id]/report`) — página completa com score
  geral, scores por pilar, resumo executivo, achados, planos de ação e roadmap; botão de impressão
  com CSS `@media print` para ocultar navegação.

---

## Estratégia sem IA generativa

O ClinicOS foi deliberadamente construído **sem dependência de IA generativa** (LLM, GPT, Claude API
ou similar). Toda a inteligência do sistema é determinística e auditável:

| Camada | Mecanismo |
| --- | --- |
| Cálculo de KPIs | Fórmulas matemáticas puras (`lib/kpis/`) |
| Avaliação de regras | Motor declarativo — array de `RuleDefinition` com threshold e operador (`lib/rules-engine/`) |
| Geração de achados | Função pura `evaluateRules()` — sem randomicidade |
| Estimativa de impacto | Calculadores determinísticos por regra (`IMPACT_CALCULATORS`) |
| Planos de ação | Templates estáticos indexados por `rule_id` (`ACTION_PLAN_TEMPLATES`) |
| Score de maturidade | Tabela de faixas fixa (`getMaturityLevel()`) |
| Recomendações do próximo ciclo | Templates determinísticos por `rule_id` (`NEXT_CYCLE_TEMPLATES`) |
| Resumo executivo | Função de template de texto (`buildExecutiveSummary()`) |

**Vantagens desta abordagem:**
- Custo operacional zero por diagnóstico (sem tokens consumidos)
- Resultados 100% reproduzíveis para os mesmos dados de entrada
- Lógica de negócio auditável pelo consultor e pelo cliente
- Calibrável pelo consultor sem alterar código (apenas os templates e thresholds)
- Deploy em qualquer provedor sem dependência de API externa

---

## Próximas versões sugeridas

### v1.2 — Benchmarks por especialidade

Atualmente os benchmarks (seção 2 de `docs/RULES_ENGINE.md`) são uniformes para todas as clínicas.
A v1.2 introduziria segmentação por especialidade médica:

- Tabela `specialty_benchmarks` no banco com thresholds por especialidade (ex.: odontologia, dermatologia,
  psicologia, nutrição)
- `getKpiStatus()` e `scoreFromBenchmark()` parametrizados pela especialidade da clínica
- Comparação "vs. clínicas da mesma especialidade" no relatório executivo
- Interface de calibração de benchmarks por especialidade para o consultor

### v2.0 — IA opcional (camada complementar)

A v2 adicionaria IA generativa como **camada opcional e complementar** — nunca substituindo o motor
determinístico, sempre enriquecendo a saída com linguagem natural:

- Narrativa executiva personalizada do resumo (substituindo o template de texto atual)
- Análise qualitativa dos achados com linguagem adaptada ao perfil da clínica
- Sugestão de metas numéricas para o próximo ciclo baseada no histórico
- Chatbot de perguntas sobre o diagnóstico (RAG sobre os dados da clínica)
- Geração de apresentação executiva (PDF) a partir do relatório

A separação entre motor determinístico (v1.x) e IA opcional (v2.x) garante que o sistema continue
funcionando e auditável mesmo sem acesso à API de IA, e que o custo por diagnóstico permaneça
controlável.
