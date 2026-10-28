
# language: pt

Funcionalidade: Login no e-commerce

  Como usuário
  Quero acessar minha conta
  Para utilizar as funcionalidades do e-commerce

  Cenário: Acessar a tela de login
    Dado que acesso a página inicial do e-commerce
    Quando acesso a opção de login
    Então devo visualizar o formulário de login

  Cenário: Tentar login com credenciais inválidas
    Dado que acesso a página inicial do e-commerce
    Quando acesso a opção de login
    E tento entrar com credenciais inválidas
    Então devo visualizar uma mensagem de erro de autenticação
