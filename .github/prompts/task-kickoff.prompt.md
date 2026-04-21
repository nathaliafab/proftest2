---
name: "Abertura de Tarefa"
description: "Use when opening a new web development task and you need a structured kickoff template with stack obrigatoria, objetivo, restricoes, definicao de pronto e criterios de teste com Gherkin/Cucumber; keywords: abertura, kickoff, React, TypeScript, Node, Gherkin, Cucumber, testes de aceitacao"
argument-hint: "Descreva a demanda em texto livre (contexto, mudanca esperada e impacto)"
agent: "Task Orchestrator"
---

Com base no contexto fornecido pelo usuario, produza uma abertura de tarefa reutilizavel e objetiva.

## Instrucoes
- Use linguagem clara e acionavel.
- Nao invente requisitos ausentes; quando faltar informacao, marque como "A confirmar".
- Garanta alinhamento com politica Docker-only do projeto.
- Mantenha escopo minimo viavel para entrega incremental.
- Trate como obrigatorio o stack: cliente React em TypeScript e servidor Node.js em TypeScript.
- Defina testes de aceitacao em linguagem Gherkin, executados com Cucumber.

## Formato de saida

### 0) Stack obrigatoria e praticas
- Cliente: React + TypeScript
- Servidor: Node.js + TypeScript
- Testes de aceitacao: Cucumber + Gherkin
- Praticas obrigatorias:
- Tipagem estrita e sem uso de any sem justificativa
- Separacao clara de responsabilidades (UI, servicos, regras de negocio)
- Validacao de entrada no cliente e no servidor
- Tratamento consistente de erros
- Execucao e validacao somente via Docker Compose

### 1) Objetivo
- Problema a resolver:
- Resultado esperado:
- Impacto no negocio/usuario:

### 2) Restricoes
- Restricoes tecnicas:
- Restricoes de arquitetura:
- Restricoes operacionais:
- Fora de escopo:

### 3) Definicao de pronto
- [ ] Codigo implementado no escopo definido
- [ ] Build do servidor via Docker concluido
- [ ] Build do cliente via Docker concluido
- [ ] Testes relevantes via Docker executados
- [ ] Documentacao atualizada (quando aplicavel)
- [ ] Sem credenciais hardcoded

### 4) Criterios de teste
- Cenario feliz:
- Cenarios de erro/validacao:
- Regressao:
- Evidencias esperadas (logs, saida de testes, comportamento observado):
- Cenarios Gherkin (Cucumber):
- Funcionalidade:
- Cenario:
- Dado:
- Quando:
- Entao:

### 5) Perguntas em aberto
- Liste apenas o que bloquearia execucao segura da tarefa.

## Entrada do usuario
{{input}}
