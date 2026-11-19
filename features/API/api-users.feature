
# language: pt

Funcionalidade: Gerenciamento de usuários na API

  Cenário: Criar um usuário com dados válidos
    Quando enviar uma requisição POST para criar um usuário
    Então a resposta CRUD da API deve ter status 201
    E o header Content-Type deve indicar JSON
    E o nome do usuário retornado deve ser "Lucas QA"
    E a resposta CRUD deve conter um ID de usuário

  Cenário: Criar um usuário sem campos obrigatórios
    Quando enviar uma requisição POST sem os campos do usuário
    Então a resposta CRUD da API deve ter status 201
    E o header Content-Type deve indicar JSON
    E a resposta deve demonstrar que a API aceita dados incompletos

  Cenário: Criar um usuário com payload JSON malformado
    Quando enviar uma requisição POST com JSON malformado
    Então a resposta CRUD da API deve ter status 500
    E o header Content-Type da resposta deve indicar HTML

  Cenário: Atualizar um usuário existente
    Quando enviar uma requisição PUT para atualizar o usuário de ID 1
    Então a resposta CRUD da API deve ter status 200
    E o header Content-Type deve indicar JSON
    E o nome do usuário retornado deve ser "Lucas QA Atualizado"
    E a resposta CRUD deve conter o ID de usuário 1

  Cenário: Atualizar um usuário com dados incompletos
    Quando enviar uma requisição PUT sem os campos do usuário para o ID 1
    Então a resposta CRUD da API deve ter status 200
    E o header Content-Type deve indicar JSON

  Cenário: Excluir um usuário existente
    Quando enviar uma requisição DELETE para o usuário de ID 1
    Então a resposta CRUD da API deve ter status 200
    E o header Content-Type deve indicar JSON
    E a resposta de exclusão deve ser um objeto JSON

  Cenário: Consultar uma rota com método HTTP não permitido
    Quando enviar uma requisição TRACE para a rota de usuários
    Então a resposta CRUD da API deve ter status 405
    E o header Content-Type da resposta deve indicar HTML