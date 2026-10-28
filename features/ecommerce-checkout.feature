
# language: pt

Funcionalidade: Checkout do e-commerce

  Como usuário
  Quero adicionar um produto ao carrinho
  Para iniciar o processo de compra

  Cenário: Adicionar produto ao carrinho
    Dado que acesso a página inicial do e-commerce
    Quando acesso a lista de produtos
    E adiciono o primeiro produto ao carrinho
    Então devo conseguir visualizar o carrinho
