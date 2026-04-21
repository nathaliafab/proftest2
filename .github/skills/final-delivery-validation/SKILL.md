---
name: final-delivery-validation
description: 'Validate final software delivery with Docker-only build and tests, plus risk and documentation checklists. Use when finishing a task, before merge, before PR review, or release readiness checks.'
argument-hint: 'Descreva o escopo alterado e a definicao de pronto para validar a entrega final'
user-invocable: true
disable-model-invocation: false
---

# Final Delivery Validation

Valida a entrega final de uma tarefa com foco em confiabilidade, regressao e completude de documentacao.

## Quando usar
- No fim de qualquer implementacao com alteracao de codigo.

## Politica obrigatoria
- Use apenas comandos via Docker Compose.
- Nao executar npm, node ou npx diretamente no host.
- Comandos devem usar caminho explicito: sistema/docker-compose.yml.

## Entradas esperadas
- Escopo alterado (arquivos, modulos ou funcionalidades).
- Criticos de negocio afetados.
- Definicao de pronto.

## Procedimento
1. Mapear escopo de mudanca e riscos principais
- Liste funcionalidades afetadas.
- Identifique pontos de regressao provavel.

2. Validar build e tipagem via Docker
- Servidor: docker compose -f sistema/docker-compose.yml run --rm server npm run build
- Cliente: docker compose -f sistema/docker-compose.yml run --rm client npm run build

3. Executar testes via Docker
- Suite de testes: docker compose -f sistema/docker-compose.yml run --rm tests npm test
- Se houver teste direcionado no projeto, execute tambem o subconjunto relevante.

4. Checklist de risco
- [ ] Nao houve quebra de API/contrato sem alinhamento explicito.
- [ ] Entradas invalidas sao tratadas com erro controlado.
- [ ] Fluxos criticos possuem cobertura de teste suficiente.
- [ ] Nao foram introduzidas dependencias inseguras ou sem necessidade.
- [ ] Nao existem segredos hardcoded.
- [ ] Erros sao tratados sem vazar detalhes sensiveis.

5. Checklist de documentacao
- [ ] README/guia operacional atualizado quando houve mudanca de uso ou setup.
- [ ] Mudancas de comportamento foram documentadas.
- [ ] Novas variaveis de ambiente foram documentadas.
- [ ] Limitacoes conhecidas e pendencias foram registradas.
- [ ] Instrucoes de execucao continuam Docker-only.

6. Relatorio final de validacao
- Informe status de cada etapa (build, testes, risco, documentacao).
- Liste falhas encontradas com impacto, severidade e recomendacao.
- Se tudo estiver ok, declarar entrega apta para review/merge.

## Formato de saida
Retorne sempre:
1. Escopo validado
2. Resultado de build
3. Resultado de testes
4. Riscos identificados e severidade
5. Estado da documentacao
6. Veredito final (Aprovado, Aprovado com ressalvas, Reprovado)
