
require('dotenv').config();

const { Given, When, Then } = require('@cucumber/cucumber');

const { HomePage } = require('../../pages/WEB/HomePage');
const { AuthPage } = require('../../pages/WEB/AuthPage');
const { ProductsPage } = require('../../pages/WEB/ProductsPage');
const { CartCheckoutPage } = require('../../pages/WEB/CartCheckoutPage');

const BASE_URL = 'https://automationexercise.com';
const TIMEOUT = 15000;

// ==================================================
// VALIDAÇÕES DE CONFIGURAÇÃO
// ==================================================

const validarCredenciais = () => {
  const email = process.env.QA_LOGIN_EMAIL;
  const senha = process.env.QA_LOGIN_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      '[CONFIGURAÇÃO] Configure QA_LOGIN_EMAIL e QA_LOGIN_PASSWORD no arquivo .env.'
    );
  }

  return { email, senha };
};

const validarDadosPagamento = () => {
  const dados = {
    name: process.env.QA_CARD_NAME,
    cardNumber: process.env.QA_CARD_NUMBER,
    cvc: process.env.QA_CARD_CVC,
    expiryMonth: process.env.QA_CARD_EXPIRY_MONTH,
    expiryYear: process.env.QA_CARD_EXPIRY_YEAR
  };

  const camposVazios = Object.entries(dados)
    .filter(([, valor]) => !valor || !String(valor).trim())
    .map(([campo]) => campo);

  if (camposVazios.length > 0) {
    throw new Error(
      `[CONFIGURAÇÃO] Configure as variáveis de pagamento no .env: ${camposVazios.join(', ')}.`
    );
  }

  return dados;
};

// ==================================================
// INICIALIZAÇÃO DOS PAGE OBJECTS
// ==================================================

const inicializarPaginas = function () {
  if (!this.page) {
    throw new Error(
      '[PLAYWRIGHT] Página não inicializada. Verifique os hooks do Cucumber.'
    );
  }

  this.homePage = this.homePage || new HomePage(this.page);
  this.authPage = this.authPage || new AuthPage(this.page);
  this.productsPage = this.productsPage || new ProductsPage(this.page);
  this.cartCheckoutPage =
    this.cartCheckoutPage || new CartCheckoutPage(this.page);
};

// ==================================================
// LOGIN
// ==================================================

const realizarLogin = async function () {
  inicializarPaginas.call(this);

  const usuarioAutenticado = await this.page
    .getByText(/logged in as/i)
    .isVisible()
    .catch(() => false);

  if (usuarioAutenticado) {
    console.log('[LOGIN] Usuário já está autenticado.');
    return;
  }

  const { email, senha } = validarCredenciais();

  await this.page.goto(`${BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT
  });

  await this.authPage.login(email, senha);

  await this.page.getByText(/logged in as/i).waitFor({
    state: 'visible',
    timeout: TIMEOUT
  });

  console.log('[LOGIN] Usuário autenticado com sucesso.');
};

// ==================================================
// PREPARAÇÃO DO CARRINHO
// ==================================================

const prepararProdutoNoCarrinho = async function () {
  try {
    inicializarPaginas.call(this);

    await realizarLogin.call(this);

    await this.homePage.openProducts();

    await this.page.waitForLoadState('domcontentloaded');

    console.log('[PRODUTOS] Lista de produtos acessada.');

    await this.productsPage.addFirstProductToCart();

    await this.productsPage.openCartFromConfirmation();

    const produtoVisivel =
      await this.productsPage.isProductVisibleInCart();

    if (!produtoVisivel) {
      throw new Error(
        'Produto não encontrado após a tentativa de inclusão.'
      );
    }

    console.log('[CARRINHO] Produto adicionado e validado com sucesso.');
  } catch (error) {
    throw new Error(
      `[PREPARAÇÃO DO CARRINHO] Falha ao preparar produto para checkout. ` +
      `URL: ${this.page ? this.page.url() : 'indisponível'}. ` +
      `Detalhe: ${error.message}`
    );
  }
};

// ==================================================
// HOME
// ==================================================

Given('que acesso a página inicial do e-commerce', async function () {
  inicializarPaginas.call(this);

  await this.homePage.open();

  console.log('[HOME] Página inicial acessada.');
});

// ==================================================
// PRODUTOS
// ==================================================

When('acesso a lista de produtos', async function () {
  inicializarPaginas.call(this);

  await this.homePage.openProducts();

  console.log('[PRODUTOS] Lista de produtos acessada.');
});

When('adiciono o primeiro produto ao carrinho', async function () {
  inicializarPaginas.call(this);

  await this.productsPage.addFirstProductToCart();
});

Then(
  'devo visualizar a confirmação de inclusão do produto',
  async function () {
    inicializarPaginas.call(this);

    await this.productsPage.addedModal.waitFor({
      state: 'visible',
      timeout: TIMEOUT
    });

    await this.productsPage.addedMessage.waitFor({
      state: 'visible',
      timeout: TIMEOUT
    });

    console.log('[CARRINHO] Confirmação de inclusão exibida.');
  }
);

// ==================================================
// CARRINHO
// ==================================================

When('acesso o carrinho', async function () {
  inicializarPaginas.call(this);

  await this.productsPage.openCartFromConfirmation();

  await this.page.waitForURL('**/view_cart', {
    timeout: TIMEOUT
  });

  console.log('[CARRINHO] Página do carrinho acessada.');
});

Then('devo visualizar o produto adicionado', async function () {
  inicializarPaginas.call(this);

  const produtoVisivel =
    await this.productsPage.isProductVisibleInCart();

  if (!produtoVisivel) {
    throw new Error(
      '[CARRINHO] O produto adicionado não foi encontrado no carrinho.'
    );
  }

  console.log('[CARRINHO] Produto encontrado no carrinho.');
});

// ==================================================
// CARRINHO VAZIO
// ==================================================

Then('devo visualizar a mensagem de carrinho vazio', async function () {
  inicializarPaginas.call(this);

  await this.page.waitForURL('**/view_cart', {
    timeout: TIMEOUT
  });

  const carrinhoVazio =
    await this.productsPage.isCartEmpty();

  if (!carrinhoVazio) {
    throw new Error(
      '[CARRINHO] O carrinho não está vazio ou a mensagem esperada não foi exibida.'
    );
  }

  console.log('[CARRINHO] Carrinho vazio validado.');
});

Then(
  'não devo conseguir prosseguir para o checkout',
  async function () {
    inicializarPaginas.call(this);

    const checkoutDisponivel =
      await this.productsPage.isCheckoutAvailable();

    if (checkoutDisponivel) {
      throw new Error(
        '[CHECKOUT] O botão Proceed To Checkout está disponível com o carrinho vazio.'
      );
    }

    console.log('[CHECKOUT] Checkout indisponível com carrinho vazio.');
  }
);

// ==================================================
// CHECKOUT POSITIVO
// ==================================================

Given('que tenho um produto no carrinho', async function () {
  await prepararProdutoNoCarrinho.call(this);
});

Given('acesso o checkout', async function () {
  inicializarPaginas.call(this);

  await this.cartCheckoutPage.proceedToCheckout();

  await this.page.locator('#address_delivery').waitFor({
    state: 'visible',
    timeout: TIMEOUT
  });

  console.log('[CHECKOUT] Página de checkout acessada.');
});

// ==================================================
// ENDEREÇO DE ENTREGA
// ==================================================

When(
  'preencho os dados pessoais e o endereço de entrega',
  async function () {
    inicializarPaginas.call(this);

    const endereco = this.page.locator('#address_delivery');

    await endereco.waitFor({
      state: 'visible',
      timeout: TIMEOUT
    });

    const textoEndereco = (await endereco.innerText()).trim();

    if (!textoEndereco) {
      throw new Error(
        '[CHECKOUT] Dados pessoais e endereço de entrega não encontrados.'
      );
    }

    console.log(
      '[CHECKOUT] Dados pessoais e endereço de entrega validados com sucesso.'
    );
  }
);

Then(
  'devo visualizar o endereço de entrega cadastrado',
  async function () {
    inicializarPaginas.call(this);

    const endereco = this.page.locator('#address_delivery');

    await endereco.waitFor({
      state: 'visible',
      timeout: TIMEOUT
    });

    const textoEndereco = (await endereco.innerText()).trim();

    if (!textoEndereco) {
      throw new Error(
        '[CHECKOUT] Endereço de entrega cadastrado não está sendo exibido.'
      );
    }

    console.log('[CHECKOUT] Endereço de entrega exibido com sucesso.');
  }
);

// ==================================================
// PAGAMENTO
// ==================================================

When(
  'preencho o formulário de pagamento com dados válidos',
  async function () {
    inicializarPaginas.call(this);

    const dadosPagamento = validarDadosPagamento();

    await this.cartCheckoutPage.openPaymentForm();

    await this.cartCheckoutPage.fillPayment(dadosPagamento);

    console.log('[PAGAMENTO] Formulário preenchido com dados válidos.');
  }
);

When('confirmo o pedido', async function () {
  inicializarPaginas.call(this);

  await this.cartCheckoutPage.pay();

  console.log('[PAGAMENTO] Pedido enviado para processamento.');
});

Then('devo visualizar a confirmação da compra', async function () {
  inicializarPaginas.call(this);

  await this.cartCheckoutPage.orderSuccessMessage.waitFor({
    state: 'visible',
    timeout: TIMEOUT
  });

  console.log('[CHECKOUT] Compra realizada com sucesso.');
});
