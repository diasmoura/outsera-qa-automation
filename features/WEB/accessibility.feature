
# language: pt

@web @a11y @acessibilidade
Funcionalidade: Validação de acessibilidade

  Como equipe de QA
  Quero validar a acessibilidade dos principais fluxos do e-commerce
  Para identificar violações dos critérios WCAG e impedir a aprovação de problemas relevantes

  @home
  Cenário: Validar acessibilidade da página inicial
    Dado que acesso a página inicial do e-commerce
    Então a página deve atender aos critérios de acessibilidade

  @checkout
  Cenário: Validar acessibilidade do checkout
    Dado que tenho um produto no carrinho
    E acesso o checkout
    Então a página deve atender aos critérios de acessibilidade

  @login
  Cenário: Validar acessibilidade da página de login
    Dado que acesso a página de login
    Então a página deve atender aos critérios de acessibilidade

  @produtos
  Cenário: Validar acessibilidade da página de produtos
    Dado que acesso a página de produtos
    Então a página deve atender aos critérios de acessibilidade

  @carrinho
  Cenário: Validar acessibilidade do carrinho
    Dado que tenho um produto no carrinho
    Então a página deve atender aos critérios de acessibilidade
