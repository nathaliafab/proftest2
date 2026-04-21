# language: pt
Funcionalidade: Gerenciamento de avaliacoes
  Como usuario do sistema
  Quero visualizar e atualizar as avaliacoes dos alunos por meta
  Para acompanhar o progresso em Requisitos, Testes e outras metas

  Cenario: Listar matriz de avaliacoes por aluno
    Dado que existe um aluno com nome "Davi Cruz", cpf "22233344455" e email "davi@escola.com"
    Quando eu consulto a matriz de avaliacoes
    Entao devo ver a meta "Requisitos" na matriz
    E devo ver a meta "Testes" na matriz
    E a matriz deve conter o aluno "Davi Cruz"

  Cenario: Atualizar avaliacao de um aluno em uma meta
    Dado que existe um aluno com nome "Elaine Costa", cpf "33344455566" e email "elaine@escola.com"
    Quando eu atualizo a avaliacao desse aluno na meta "Requisitos" para "MPA"
    Entao a avaliacao desse aluno na meta "Requisitos" deve ser "MPA"

  Cenario: Rejeitar conceito invalido na avaliacao
    Dado que existe um aluno com nome "Fabio Rocha", cpf "44455566677" e email "fabio@escola.com"
    Quando eu tento atualizar a avaliacao desse aluno na meta "Testes" para conceito invalido
    Entao devo receber erro de validacao na avaliacao

  Cenario: Forcar envio de email com consolidacao de multiplas metas no dia
    Dado que existe um aluno com nome "Helena Lima", cpf "55566677788" e email "helena@escola.com"
    E que existe uma turma com topico "Arquitetura", ano 2026, semestre 1 e o aluno cadastrado
    Quando eu atualizo na turma a avaliacao do aluno na meta "Requisitos" para "MPA"
    E eu atualizo na turma a avaliacao do aluno na meta "Testes" para "MA"
    E eu forco o envio do email de avaliacoes desse aluno
    Entao devo receber confirmacao de envio forcado com pelo menos 1 email
    E deve existir 1 email enviado para esse aluno
    E o ultimo email enviado deve conter a meta "Requisitos"
    E o ultimo email enviado deve conter a meta "Testes"

  Cenario: Forcar envio de email consolidando alteracoes em turmas diferentes
    Dado que existe um aluno com nome "Igor Nunes", cpf "66677788899" e email "igor@escola.com"
    E que existem turmas "Backend" e "Frontend" para esse aluno
    Quando eu atualizo na turma "Backend" a avaliacao desse aluno na meta "Documentacao" para "MPA"
    E eu atualizo na turma "Frontend" a avaliacao desse aluno na meta "BoasPraticas" para "MA"
    E eu forco o envio do email de avaliacoes desse aluno
    Entao deve existir 1 email enviado para esse aluno
    E o ultimo email enviado deve conter a turma "Backend"
    E o ultimo email enviado deve conter a turma "Frontend"