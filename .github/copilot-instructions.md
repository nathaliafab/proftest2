# Politica Docker-Only

Estas instrucoes sao sempre ativas neste repositorio.

## Regra principal
- Execute build, teste, validacao e instalacao de dependencias somente via Docker Compose.
- Nunca sugerir ou executar npm, node, npx, pnpm, yarn, bun ou similares no host.

## Comandos padrao do projeto
- Use o arquivo Compose em sistema/docker-compose.yml.
- Sempre preferir o formato com caminho explicito para evitar erro de diretorio atual.

### Exemplos permitidos
- Subir servicos: docker compose -f sistema/docker-compose.yml up --build
- Compilar servidor: docker compose -f sistema/docker-compose.yml run --rm server npm run build
- Compilar cliente: docker compose -f sistema/docker-compose.yml run --rm client npm run build
- Rodar testes: docker compose -f sistema/docker-compose.yml run --rm tests npm test
- Instalar dependencia no servidor: docker compose -f sistema/docker-compose.yml run --rm server npm install <pacote>
- Instalar dependencia no cliente: docker compose -f sistema/docker-compose.yml run --rm client npm install <pacote>

## Regras de seguranca e consistencia
- Se um comando sugerido nao for Docker-only, substituir por equivalente via docker compose.
- Antes de concluir uma tarefa com alteracao de codigo, validar build e testes no escopo afetado.
- Em alteracoes de comportamento, exigir atualizacao de documentacao relevante.
- Nao hardcodar credenciais; usar variaveis de ambiente.

## Regra de resposta
- Quando houver duvida de comando, priorizar a opcao mais conservadora e explicita com docker compose -f sistema/docker-compose.yml.
