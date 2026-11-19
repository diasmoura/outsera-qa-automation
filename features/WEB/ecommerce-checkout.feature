
# language: pt

@web @checkout
Funcionalidade: Checkout do e-commerce

  Como usuário do e-commerce
  Quero adicionar produtos ao carrinho e finalizar uma compra
  Para validar o fluxo de compra e suas regras de negócio

  @positivo @carrinho @acessibilidade
  Cenário: Adicionar produto ao carrinho
    Dado que acesso a página inicial do e-commerce
    Então a página deve ser analisada quanto à acessibilidade
    Quando acesso a lista de produtos
    Então a página deve ser analisada quanto à acessibilidade
    Quando adiciono o primeiro produto ao carrinho
    Então devo visualizar a confirmação de inclusão do produto
    Quando acesso o carrinho
    Então a página deve ser analisada quanto à acessibilidade
    E devo visualizar o produto adicionado

  @positivo @checkout @acessibilidade
  Cenário: Realizar compra completa com dados válidos
    Dado que tenho um produto no carrinho
    E acesso o checkout
    Então a página deve ser analisada quanto à acessibilidade
    Quando preencho os dados pessoais e o endereço de entrega
    E preencho o formulário de pagamento com dados válidos
    E confirmo o pedido
    Então devo visualizar a confirmação da compra

  @positivo @endereco @acessibilidade
  Cenário: Validar endereço de entrega exibido no checkout
    Dado que tenho um produto no carrinho
    E acesso o checkout
    Então a página deve ser analisada quanto à acessibilidade
    E devo visualizar o endereço de entrega cadastrado

  @negativo @carrinho
  Cenário: Tentar acessar o checkout com o carrinho vazio
    Dado que acesso a página inicial do e-commerce
    Quando acesso o carrinho
    Então devo visualizar a mensagem de carrinho vazio
    E não devo conseguir prosseguir para o checkout
