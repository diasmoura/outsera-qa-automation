
# language: pt

Funcionalidade: Gerenciamento de usuários

  Cenário: Criar um usuário com dados válidos
    Quando enviar uma requisição POST para criar um usuário
    Então a resposta CRUD da API deve ter status 201
    E o header Content-Type deve indicar JSON
    E o nome do usuário retornado deve ser "Lucas QA"

  Cenário: Atualizar um usuário existente
    Quando enviar uma requisição PUT para atualizar o usuário de ID 1
    Então a resposta CRUD da API deve ter status 200
    E o header Content-Type deve indicar JSON
    E o nome do usuário retornado deve ser "Lucas QA Atualizado"

  Cenário: Excluir um usuário existente
    Quando enviar uma requisição DELETE para o usuário de ID 1
    Então a resposta CRUD da API deve ter status 200
