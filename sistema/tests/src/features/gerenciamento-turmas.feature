# language: pt
Funcionalidade: Gerenciamento de turmas
  Como usuario do sistema
  Quero cadastrar, alterar e remover turmas com alunos e avaliacoes
  Para visualizar cada turma separadamente com suas matriculas e conceitos

  Cenario: Cadastrar e consultar turma com alunos matriculados
    Dado que existe um aluno com nome "Gabi Nunes", cpf "55566677799" e email "gabi@escola.com"
    E que existe um aluno com nome "Heitor Alves", cpf "66677788899" e email "heitor@escola.com"
    Quando eu cadastro uma turma com topico "Introducao a Programacao", ano 2026, semestre 1 e os alunos cadastrados
    Entao devo encontrar a turma "Introducao a Programacao" na lista de turmas
    E devo visualizar 2 alunos na turma selecionada

  Cenario: Alterar dados de uma turma existente
    Dado que existe um aluno com nome "Iris Melo", cpf "77788899900" e email "iris@escola.com"
    E que existe uma turma com topico "Algoritmos", ano 2026, semestre 1 e o aluno cadastrado
    Quando eu altero a turma para topico "Algoritmos Avancados", ano 2026 e semestre 2
    Entao a turma alterada deve possuir topico "Algoritmos Avancados"
    E a turma alterada deve possuir semestre 2

  Cenario: Remover uma turma existente
    Dado que existe um aluno com nome "Joao Prado", cpf "88899900011" e email "joao@escola.com"
    E que existe uma turma com topico "Estruturas de Dados", ano 2026, semestre 1 e o aluno cadastrado
    Quando eu removo a turma cadastrada
    Entao nao devo encontrar a turma removida na lista

  Cenario: Atualizar avaliacao de aluno dentro da turma
    Dado que existe um aluno com nome "Karina Dias", cpf "99900011122" e email "karina@escola.com"
    E que existe uma turma com topico "POO", ano 2026, semestre 1 e o aluno cadastrado
    Quando eu atualizo na turma a avaliacao do aluno na meta "Requisitos" para "MA"
    Entao a avaliacao da turma para esse aluno na meta "Requisitos" deve ser "MA"

  Cenario: Rejeitar turma com aluno inexistente
    Dado que nao existem alunos cadastrados
    Quando eu tento cadastrar turma com aluno inexistente
    Entao devo receber erro de validacao da turma