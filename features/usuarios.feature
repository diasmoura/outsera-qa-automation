
# language: pt

Funcionalidade: Consulta de usuários

  Cenário: Consultar um usuário existente
    Quando consultar o usuário de ID 1
    Então a resposta da API deve ter status 200
    E o header Content-Type da consulta deve indicar JSON
    E o nome do usuário deve estar preenchido

  Cenário: Consultar um usuário inexistente
    Quando consultar o usuário de ID 999
    Então a resposta da API deve ter status 404
