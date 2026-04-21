# language: pt
Funcionalidade: Gerenciamento de alunos
  Como usuario do sistema
  Quero cadastrar, alterar, listar e remover alunos
  Para manter os dados dos alunos atualizados

  Cenario: Cadastrar e listar um aluno
    Dado que nao existem alunos cadastrados
    Quando eu cadastro um aluno com nome "Ana Silva", cpf "12345678901" e email "ana@escola.com"
    Entao devo encontrar 1 aluno cadastrado
    E o aluno deve possuir nome "Ana Silva"

  Cenario: Alterar um aluno existente
    Dado que existe um aluno com nome "Bruno Lima", cpf "98765432100" e email "bruno@escola.com"
    Quando eu altero esse aluno para nome "Bruno Lima Junior", cpf "98765432100" e email "brunojr@escola.com"
    Entao o aluno alterado deve possuir nome "Bruno Lima Junior"
    E o aluno alterado deve possuir email "brunojr@escola.com"

  Cenario: Remover um aluno existente
    Dado que existe um aluno com nome "Carla Souza", cpf "55566677788" e email "carla@escola.com"
    Quando eu removo esse aluno
    Entao nao devo encontrar o aluno removido na lista

  Cenario: Rejeitar cadastro com email invalido
    Dado que nao existem alunos cadastrados
    Quando eu tento cadastrar um aluno com email invalido
    Entao devo receber erro de validacao

  Cenario: Rejeitar cadastro com CPF duplicado
    Dado que existe um aluno com nome "Laura Campos", cpf "11122233344" e email "laura@escola.com"
    Quando eu tento cadastrar outro aluno com mesmo cpf "11122233344" e email "laura2@escola.com"
    Entao devo receber erro de conflito