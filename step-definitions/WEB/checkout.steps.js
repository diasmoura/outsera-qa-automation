
require('dotenv').config();

const { Given, When, Then } = require('@cucumber/cucumber');

const { HomePage } = require('../../pages/WEB/HomePage');
const { AuthPage } = require('../../pages/WEB/AuthPage');
const ProductsPage = require('../../pages/WEB/ProductsPage');
const { CartCheckoutPage } = require('../../pages/WEB/CartCheckoutPage');

const BASE_URL = 'https://automationexercise.com';
const TIMEOUT = 20000;

// ==================================================
// VALIDAÇÕES DE CONFIGURAÇÃO
// ==================================================

const validarCredenciais = () => {
  const email = process.env.QA_LOGIN_EMAIL;
  const senha = process.env.QA_LOGIN_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      '[CONFIGURAÇÃO] Configure QA_LOGIN_EMAIL e QA_LOGIN_PASSWORD no .env.'
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

    await this.productsPage.ensureProductsPage();

    console.log('[PRODUTOS] Lista de produtos acessada.');

    await this.productsPage.addFirstProductToCart();

    await this.productsPage.openCartFromConfirmation();

    const produtoAdicionado =
      await this.productsPage.isProductVisibleInCart();

    if (!produtoAdicionado) {
      throw new Error(
        'O produto não foi encontrado no carrinho após a inclusão.'
      );
    }

    console.log(
      '[CARRINHO] Produto adicionado e validado com sucesso.'
    );

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

Given('que acesso a página inicial', async function () {
  inicializarPaginas.call(this);

  await this.homePage.open();

  console.log('[HOME] Página inicial acessada.');
});

// ==================================================
// PRODUTOS
// ==================================================

Given('que acesso a lista de produtos', async function () {
  inicializarPaginas.call(this);

  await this.homePage.openProducts();
  await this.productsPage.ensureProductsPage();

  console.log('[PRODUTOS] Lista de produtos acessada.');
});

When('acesso a lista de produtos', async function () {
  inicializarPaginas.call(this);

  await this.homePage.openProducts();
  await this.productsPage.ensureProductsPage();

  console.log('[PRODUTOS] Lista de produtos acessada.');
});

// ==================================================
// ADICIONAR PRODUTO AO CARRINHO
// ==================================================

When('adiciono o primeiro produto ao carrinho', async function () {
  inicializarPaginas.call(this);

  await this.productsPage.addFirstProductToCart();

  console.log('[CARRINHO] Inclusão do produto solicitada.');
});

Then('devo visualizar a confirmação de inclusão do produto', async function () {
  inicializarPaginas.call(this);

  const confirmado =
    await this.productsPage.isAddToCartConfirmationVisible();

  if (!confirmado) {
    throw new Error(
      'A confirmação de inclusão do produto não foi exibida.'
    );
  }

  console.log('[CARRINHO] Confirmação de inclusão validada.');
});

Then('devo visualizar a confirmação de produto adicionado', async function () {
  inicializarPaginas.call(this);

  const confirmado =
    await this.productsPage.isAddToCartConfirmationVisible();

  if (!confirmado) {
    throw new Error(
      'A confirmação de inclusão do produto não foi exibida.'
    );
  }

  console.log('[CARRINHO] Confirmação de inclusão validada.');
});

// ==================================================
// ACESSAR CARRINHO
// ==================================================

When('acesso o carrinho', async function () {
  inicializarPaginas.call(this);

  await this.productsPage.openCartFromConfirmation();

  console.log('[CARRINHO] Página do carrinho acessada.');
});

When('acesso o carrinho de compras', async function () {
  inicializarPaginas.call(this);

  await this.productsPage.openCartFromConfirmation();

  console.log('[CARRINHO] Página do carrinho acessada.');
});

// ==================================================
// VALIDAR PRODUTO NO CARRINHO
// ==================================================

Then('devo visualizar o produto adicionado', async function () {
  inicializarPaginas.call(this);

  const produtoVisivel =
    await this.productsPage.isProductVisibleInCart();

  if (!produtoVisivel) {
    throw new Error('Produto não encontrado no carrinho.');
  }

  console.log('[CARRINHO] Produto adicionado validado.');
});

Then('devo visualizar o produto no carrinho', async function () {
  inicializarPaginas.call(this);

  const produtoVisivel =
    await this.productsPage.isProductVisibleInCart();

  if (!produtoVisivel) {
    throw new Error('Produto não encontrado no carrinho.');
  }

  console.log('[CARRINHO] Produto encontrado no carrinho.');
});

// ==================================================
// PREPARAÇÃO PARA CHECKOUT
// ==================================================

Given('que tenho um produto no carrinho', async function () {
  await prepararProdutoNoCarrinho.call(this);
});

Given('acesso o checkout', async function () {
  inicializarPaginas.call(this);

  if (!this.page.url().includes('/view_cart')) {
    await this.productsPage.openCartFromConfirmation();
  }

  await this.productsPage.proceedToCheckout();

  console.log('[CHECKOUT] Acesso ao checkout solicitado.');
});

// ==================================================
// DADOS PESSOAIS E ENDEREÇO
// ==================================================

When('preencho os dados pessoais e o endereço de entrega', async function () {
  inicializarPaginas.call(this);

  const { email, senha } = validarCredenciais();

  if (
    typeof this.cartCheckoutPage.fillDeliveryDetails !== 'function'
  ) {
    throw new Error(
      'O método fillDeliveryDetails() não existe no CartCheckoutPage.js.'
    );
  }

  await this.cartCheckoutPage.fillDeliveryDetails({
    email,
    senha
  });

  console.log(
    '[CHECKOUT] Dados pessoais e endereço de entrega validados.'
  );
});

Then('devo visualizar o endereço de entrega cadastrado', async function () {
  inicializarPaginas.call(this);

  if (
    typeof this.cartCheckoutPage.validateDeliveryAddress !== 'function'
  ) {
    throw new Error(
      'O método validateDeliveryAddress() não existe no CartCheckoutPage.js.'
    );
  }

  const valido =
    await this.cartCheckoutPage.validateDeliveryAddress();

  if (!valido) {
    throw new Error(
      'Endereço de entrega não foi exibido corretamente.'
    );
  }

  console.log('[CHECKOUT] Endereço de entrega validado.');
});

Then('devo visualizar os dados de entrega', async function () {
  inicializarPaginas.call(this);

  if (
    typeof this.cartCheckoutPage.validateDeliveryAddress !== 'function'
  ) {
    throw new Error(
      'O método validateDeliveryAddress() não existe no CartCheckoutPage.js.'
    );
  }

  const valido =
    await this.cartCheckoutPage.validateDeliveryAddress();

  if (!valido) {
    throw new Error(
      'Dados de entrega não foram exibidos corretamente.'
    );
  }

  console.log('[CHECKOUT] Dados de entrega validados.');
});

// ==================================================
// PAGAMENTO
// ==================================================

When('preencho o formulário de pagamento com dados válidos', async function () {
  inicializarPaginas.call(this);

  const dados = validarDadosPagamento();

  if (
    typeof this.cartCheckoutPage.openPaymentForm !== 'function' ||
    typeof this.cartCheckoutPage.fillPaymentForm !== 'function'
  ) {
    throw new Error(
      'Métodos de pagamento não encontrados no CartCheckoutPage.js.'
    );
  }

  // Abre a página de pagamento.
  await this.cartCheckoutPage.openPaymentForm();

  // Preenche os dados do cartão.
  await this.cartCheckoutPage.fillPaymentForm(dados);

  console.log('[PAGAMENTO] Formulário preenchido com sucesso.');
});

When('preencho os dados de pagamento', async function () {
  inicializarPaginas.call(this);

  const dados = validarDadosPagamento();

  if (
    typeof this.cartCheckoutPage.openPaymentForm !== 'function' ||
    typeof this.cartCheckoutPage.fillPaymentForm !== 'function'
  ) {
    throw new Error(
      'Métodos de pagamento não encontrados no CartCheckoutPage.js.'
    );
  }

  await this.cartCheckoutPage.openPaymentForm();

  await this.cartCheckoutPage.fillPaymentForm(dados);

  console.log('[PAGAMENTO] Dados de pagamento preenchidos.');
});

// ==================================================
// CONFIRMAR COMPRA
// ==================================================

When('confirmo o pedido', async function () {
  inicializarPaginas.call(this);

  if (
    typeof this.cartCheckoutPage.placeOrder !== 'function'
  ) {
    throw new Error(
      'O método placeOrder() não existe no CartCheckoutPage.js.'
    );
  }

  await this.cartCheckoutPage.placeOrder();

  console.log('[PAGAMENTO] Pedido enviado para processamento.');
});

// ==================================================
// CONFIRMAÇÃO DA COMPRA
// ==================================================

Then('devo visualizar a confirmação da compra', async function () {
  inicializarPaginas.call(this);

  if (
    typeof this.cartCheckoutPage.isOrderConfirmed !== 'function'
  ) {
    throw new Error(
      'O método isOrderConfirmed() não existe no CartCheckoutPage.js.'
    );
  }

  const confirmado =
    await this.cartCheckoutPage.isOrderConfirmed();

  if (!confirmado) {
    throw new Error(
      'A confirmação da compra não foi exibida.'
    );
  }

  console.log('[CHECKOUT] Compra realizada com sucesso.');
});

// ==================================================
// CARRINHO VAZIO
// ==================================================

Given('que estou com o carrinho vazio', async function () {
  inicializarPaginas.call(this);

  await this.page.goto(`${BASE_URL}/view_cart`, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT
  });

  await this.productsPage.waitForCartPage();

  console.log('[CARRINHO] Página do carrinho acessada.');
});

Then('devo visualizar a mensagem de carrinho vazio', async function () {
  inicializarPaginas.call(this);

  const vazio = await this.productsPage.isCartEmpty();

  if (!vazio) {
    throw new Error('O carrinho não está vazio.');
  }

  console.log('[CARRINHO] Carrinho vazio validado.');
});

Then('não devo conseguir prosseguir para o checkout', async function () {
  inicializarPaginas.call(this);

  const disponivel =
    await this.productsPage.isCheckoutAvailable();

  if (disponivel) {
    throw new Error(
      'O checkout está disponível mesmo com o carrinho vazio.'
    );
  }

  console.log(
    '[CHECKOUT] Checkout indisponível com carrinho vazio.'
  );
});
