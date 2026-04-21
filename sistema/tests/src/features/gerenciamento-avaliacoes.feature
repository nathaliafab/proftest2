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