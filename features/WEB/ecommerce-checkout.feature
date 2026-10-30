
# language: pt

Funcionalidade: Checkout do e-commerce

  Como usuário do e-commerce
  Quero adicionar produtos ao carrinho e finalizar uma compra
  Para validar o fluxo de compra e suas regras de negócio

  @positivo @carrinho
  Cenário: Adicionar produto ao carrinho
    Dado que acesso a página inicial do e-commerce
    Quando acesso a lista de produtos
    E adiciono o primeiro produto ao carrinho
    Então devo visualizar a confirmação de inclusão do produto
    Quando acesso o carrinho
    Então devo visualizar o produto adicionado

  @positivo @checkout
  Cenário: Realizar compra completa com dados válidos
    Dado que tenho um produto no carrinho
    E acesso o checkout
    Quando preencho os dados pessoais e o endereço de entrega
    E preencho o formulário de pagamento com dados válidos
    E confirmo o pedido
    Então devo visualizar a confirmação da compra

  @positivo @endereco
  Cenário: Validar endereço de entrega exibido no checkout
    Dado que tenho um produto no carrinho
    E acesso o checkout
    Então devo visualizar o endereço de entrega cadastrado

  @negativo @carrinho
  Cenário: Tentar acessar o checkout com o carrinho vazio
    Dado que acesso a página inicial do e-commerce
    Quando acesso o carrinho
    Então devo visualizar a mensagem de carrinho vazio
    E não devo conseguir prosseguir para o checkout
