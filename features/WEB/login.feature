
# language: pt

Funcionalidade: Login de usuário
  Como usuário do e-commerce
  Quero acessar minha conta
  Para visualizar as funcionalidades disponíveis

  @positivo @login
  Cenário: Realizar login com credenciais válidas
    Dado que acesso a página de login
    Quando realizo login com credenciais cadastradas
    Então devo acessar minha conta com sucesso

  @negativo @login
  Cenário: Realizar login com senha incorreta
    Dado que acesso a página de login
    Quando informo um e-mail cadastrado
    E informo uma senha incorreta
    E solicito o login
    Então devo visualizar uma mensagem de erro de autenticação

  @negativo @login
  Cenário: Realizar login com usuário inexistente
    Dado que acesso a página de login
    Quando informo um e-mail não cadastrado
    E informo uma senha qualquer
    E solicito o login
    Então devo visualizar uma mensagem de usuário não encontrado

  @negativo @login
  Cenário: Tentar realizar login com os campos obrigatórios em branco
    Dado que acesso a página de login
    Quando deixo o e-mail e a senha em branco
    E solicito o login
    Então devo visualizar as validações dos campos obrigatórios
