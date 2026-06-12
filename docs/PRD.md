# PRD v1.0 — ClinicOS AI

### Sistema Operacional Inteligente para Clínicas Premium

**Autor:** Thiago Sousa
**Versão:** MVP 1.0
**Data:** Junho/2026

---

# 1. Visão do Produto

## Problema

Clínicas de:

* Emagrecimento
* Reposição Hormonal
* Nutrologia
* Medicina Integrativa
* Estética Avançada

possuem grande dificuldade em:

* Medir KPIs
* Identificar gargalos
* Construir planos de ação
* Acompanhar execução
* Tomar decisões baseadas em dados

A gestão normalmente é feita por percepção.

---

## Solução

O ClinicOS AI será um consultor virtual especializado em clínicas premium capaz de:

1. Receber dados da clínica.
2. Calcular KPIs automaticamente.
3. Diagnosticar gargalos.
4. Gerar score da clínica.
5. Criar planos de ação.
6. Criar projetos e tarefas.
7. Refinar continuamente a estratégia.

---

# 2. Persona Principal

## Consultor

Exemplo:

Thiago Sousa

Necessidades:

* Diagnosticar clínicas rapidamente
* Produzir entregas padronizadas
* Escalar consultoria
* Aumentar valor percebido

---

## Cliente Final

Proprietário de clínica premium.

Busca:

* Crescimento
* Lucro
* Escala
* Organização

---

# 3. Objetivos de Negócio

## Curto prazo

* Acelerar diagnósticos
* Reduzir tempo de análise
* Padronizar entregas

---

## Médio prazo

* Atender mais clínicas
* Criar metodologia proprietária

---

## Longo prazo

Transformar em SaaS recorrente.

---

# 4. Módulos do MVP

## Módulo 1 — Cadastro da Clínica

Campos:

### Gerais

* Nome
* Cidade
* Estado
* Tempo de mercado
* Especialidades

### Equipe

* Médicos
* Nutricionistas
* Recepção
* Comercial
* Gestores

---

## Módulo 2 — Comercial

Inputs:

* Leads
* Agendamentos
* Comparecimentos
* Vendas
* Renovações
* Indicações
* Ticket médio
* Tempo de resposta
* Tempo até consulta

---

## KPIs Calculados

### Taxa de Agendamento

Agendamentos ÷ Leads

---

### Comparecimento

Comparecimentos ÷ Agendamentos

---

### Conversão

Vendas ÷ Comparecimentos

---

### Renovação

Renovações ÷ Pacientes elegíveis

---

### Indicação

Indicados ÷ Novos pacientes

---

# 5. Módulo Financeiro

Inputs:

* Receita bruta
* Impostos
* Custos diretos
* Folha salarial
* Marketing
* Comissões
* Financeiro
* Outras despesas

---

## Cálculos

### Receita Líquida

Receita − Impostos

---

### Lucro Bruto

Receita líquida − custos diretos

---

### EBITDA

Lucro bruto − despesas operacionais

---

### Lucro Líquido

EBITDA − financeiro

---

### Margem Líquida

Lucro líquido ÷ receita

---

# 6. Módulo Produtos

Para cada produto:

* Nome
* Preço
* Quantidade vendida
* Custos
* Comissão
* Tempo da equipe

Outputs:

* Receita
* Margem
* Lucro
* Ranking

---

# 7. Módulo Diagnóstico

Cada área recebe um score:

| Pilar      | Peso |
| ---------- | ---: |
| Comercial  |   25 |
| Financeiro |   30 |
| Retenção   |   20 |
| Marketing  |   15 |
| Operação   |   10 |

Score total:

0–100

---

## Classificação

| Score  | Status    |
| ------ | --------- |
| 0–39   | Crítico   |
| 40–59  | Atenção   |
| 60–79  | Bom       |
| 80–100 | Excelente |

---

# 8. Motor de Regras

Exemplos:

---

### Regra 001

Se:

Comparecimento < 75%

Resultado:

🔴 Alto no-show

---

### Regra 002

Se:

Tempo de resposta > 15 min

Resultado:

🔴 SLA crítico

---

### Regra 003

Se:

Margem líquida < 10%

Resultado:

🔴 Rentabilidade comprometida

---

### Regra 004

Se:

Folha > 40% do faturamento

Resultado:

🟡 Estrutura possivelmente inchada

---

### Regra 005

Se:

Indicações < 10%

Resultado:

🟡 Baixa satisfação ou ativação da base

---

# 9. Plano de Ação Automático

Cada gargalo gera:

## Projeto

Exemplo:

**Projeto: Recuperação de No-show**

---

### Fase 1 — Diagnóstico

* Levantar motivos
* Analisar tempo até consulta

---

### Fase 2 — Processo

* Criar régua de confirmação
* Definir SLA

---

### Fase 3 — Tecnologia

* Implantar CRM
* Implantar automações

---

# 10. Tarefas

Cada projeto gera:

* Responsável
* Prazo
* Status
* KPI esperado

---

# 11. Dashboard

Exibir:

* Score geral
* Score por área
* KPIs
* Gargalos
* Prioridades
* Projetos

---

# 12. Arquitetura Técnica

Frontend:

* Next.js 15
* TypeScript
* Tailwind
* shadcn/ui

Backend:

* Next.js API
* Prisma ORM

Banco:

* PostgreSQL

Autenticação:

* Clerk

IA:

* OpenAI API

Deploy:

* Vercel

---

# 13. Roadmap

## MVP

* Login
* Cadastro
* Diagnóstico
* KPIs
* Plano de ação
* Dashboard

---

## V2

* Histórico mensal
* Comparação temporal
* Upload de DRE
* IA conversacional

---

## V3

* Integração CRM
* WhatsApp
* ClickUp
* ERP médico

---