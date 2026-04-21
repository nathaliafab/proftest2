# proftest2

Sistema web inicial para gerenciamento de alunos e avaliacoes.

## Stack obrigatoria

- Cliente: React + TypeScript
- Servidor: Node.js + TypeScript
- Testes de aceitacao: Cucumber + Gherkin
- Execucao: somente via Docker Compose

## Funcionalidade inicial entregue

Gerenciamento de alunos com:

- inclusao de aluno
- alteracao de aluno
- remocao de aluno
- pagina especifica com listagem de alunos cadastrados

Gerenciamento de avaliacoes em pagina separada com:

- tabela por aluno e metas
- colunas de metas (Requisitos, Testes, Documentacao, BoasPraticas)
- conceitos MANA, MPA e MA por meta
- alteracao de avaliacao por aluno/meta
- legenda visual dos conceitos (MANA vermelho, MPA amarelo, MA verde)
- filtro por aluno e por meta/conceito
- ordenacao por aluno ou por meta (crescente/decrescente)

Cada aluno possui os campos:

- nome
- CPF
- email

## Estrutura de pastas

- sistema/server: API REST em Node.js + TypeScript
- sistema/client: interface React + TypeScript
- sistema/tests: testes de aceitacao com Cucumber

## Como executar em desenvolvimento

Subir cliente e servidor:

```bash
docker compose -f sistema/docker-compose.yml up --build
```

Aplicacao cliente: http://localhost:3000  
API servidor: http://localhost:3001

## Build via Docker

Build do servidor:

```bash
docker compose -f sistema/docker-compose.yml run --rm server npm run build
```

Build do cliente:

```bash
docker compose -f sistema/docker-compose.yml run --rm client npm run build
```

## Testes de aceitacao via Docker

```bash
docker compose -f sistema/docker-compose.yml run --rm tests npm test
```

## API de alunos

Base URL: http://localhost:3001

- GET /health: status da API
- GET /students: lista todos os alunos
- POST /students: cria um aluno
- PUT /students/:id: altera um aluno
- DELETE /students/:id: remove um aluno

## API de avaliacoes

- GET /assessments: retorna matriz de avaliacoes (metas, conceitos e linhas por aluno)
- PUT /assessments/:studentId: atualiza as avaliacoes do aluno informado

### Exemplo de payload para atualizar avaliacao

```json
{
	"evaluations": {
		"Requisitos": "MPA",
		"Testes": "MA",
		"Documentacao": "MANA",
		"BoasPraticas": "MPA"
	}
}
```

### Exemplo de payload

```json
{
	"name": "Ana Silva",
	"cpf": "12345678901",
	"email": "ana@escola.com"
}
```

## Validacoes iniciais implementadas

- nome com no minimo 3 caracteres
- CPF com 11 digitos numericos
- email valido
- CPF unico
- email unico

## Feedback visual na interface

- avisos de campo obrigatorio por campo (nome, CPF e email)
- indicacao visual de campo invalido no formulario
- aviso explicito quando o usuario tenta informar letras/simbolos no CPF
- confirmacao antes de remover aluno
- notificacoes em toast para sucesso, erro e avisos de envio

## Paginas da interface

- /alunos: gerenciamento de cadastro de alunos
- /avaliacoes: gerenciamento das avaliacoes por metas

## Cenarios de aceitacao (Gherkin)

Arquivo: sistema/tests/src/features/gerenciamento-alunos.feature

- cadastrar e listar aluno
- alterar aluno existente
- remover aluno existente
- rejeitar cadastro com email invalido

Arquivo: sistema/tests/src/features/gerenciamento-avaliacoes.feature

- listar matriz de avaliacoes por aluno
- atualizar avaliacao por meta
- rejeitar conceito invalido na avaliacao
