
require('dotenv').config();

const { Given, When, Then } = require('@cucumber/cucumber');

const { HomePage } = require('../../pages/WEB/HomePage');
const { AuthPage } = require('../../pages/WEB/AuthPage');
const { ProductsPage } = require('../../pages/WEB/ProductsPage');
const { CartCheckoutPage } = require('../../pages/WEB/CartCheckoutPage');

const BASE_URL = 'https://automationexercise.com';

// ==================================================
// VALIDAÇÕES DE DADOS
// ==================================================

const validarCredenciais = () => {
  const email = process.env.QA_LOGIN_EMAIL;
  const senha = process.env.QA_LOGIN_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      'Configure QA_LOGIN_EMAIL e QA_LOGIN_PASSWORD no arquivo .env.'
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
    .filter(([, valor]) => !valor)
    .map(([campo]) => campo);

  if (camposVazios.length > 0) {
    throw new Error(
      `Configure no .env os seguintes campos: ${camposVazios.join(', ')}.`
    );
  }

  return dados;
};

// ==================================================
// LOGIN
// ==================================================

const realizarLogin = async function () {
  const { email, senha } = validarCredenciais();

  this.authPage = new AuthPage(this.page);

  await this.page.goto(`${BASE_URL}/login`);

  await this.authPage.login(email, senha);

  await this.page.getByText(/logged in as/i).waitFor({
    state: 'visible',
    timeout: 15000
  });

  console.log('[LOGIN] Usuário autenticado com sucesso.');
};

// ==================================================
// PREPARAR CARRINHO COM USUÁRIO AUTENTICADO
// ==================================================

const prepararProdutoNoCarrinho = async function () {
  this.homePage = new HomePage(this.page);
  this.productsPage = new ProductsPage(this.page);
  this.cartCheckoutPage = new CartCheckoutPage(this.page);

  await this.homePage.open();

  await realizarLogin.call(this);

  await this.homePage.openProducts();

  await this.productsPage.addFirstProductToCart();

  await this.productsPage.openCartFromConfirmation();

  const produtoVisivel =
    await this.productsPage.isProductVisibleInCart();

  if (!produtoVisivel) {
    throw new Error(
      'O produto não foi encontrado no carrinho.'
    );
  }

  console.log('[CARRINHO] Produto adicionado e validado.');
};

// ==================================================
// HOME E PRODUTOS
// ==================================================

Given('que acesso a página inicial do e-commerce', async function () {
  this.homePage = new HomePage(this.page);

  await this.homePage.open();
});

When('acesso a lista de produtos', async function () {
  this.productsPage = new ProductsPage(this.page);

  await this.homePage.openProducts();
});

When('adiciono o primeiro produto ao carrinho', async function () {
  await this.productsPage.addFirstProductToCart();
});

Then('devo visualizar a confirmação de inclusão do produto', async function () {
  await this.productsPage.addedModal
    .getByText('Added!', { exact: true })
    .waitFor({
      state: 'visible',
      timeout: 10000
    });

  console.log(
    '[CARRINHO] Confirmação de inclusão do produto exibida.'
  );
});

// ==================================================
// CARRINHO
// ==================================================

When('acesso o carrinho', async function () {
  if (this.productsPage) {
    await this.productsPage.openCartFromConfirmation();
  } else {
    this.homePage = this.homePage || new HomePage(this.page);

    await this.homePage.openCart();
  }
});

Then('devo visualizar o produto adicionado', async function () {
  const produtoVisivel =
    await this.productsPage.isProductVisibleInCart();

  if (!produtoVisivel) {
    throw new Error(
      'O produto adicionado não foi encontrado no carrinho.'
    );
  }

  console.log('[CARRINHO] Produto encontrado no carrinho.');
});

Then('devo visualizar a mensagem de carrinho vazio', async function () {
  await this.page.getByText(/cart is empty/i).waitFor({
    state: 'visible',
    timeout: 10000
  });

  console.log('[CARRINHO] Mensagem de carrinho vazio exibida.');
});

Then('não devo conseguir prosseguir para o checkout', async function () {
  const checkout = this.page.getByText(
    'Proceed To Checkout',
    { exact: true }
  );

  const visivel = await checkout.isVisible().catch(() => false);

  if (visivel) {
    throw new Error(
      'O checkout está disponível mesmo com o carrinho vazio.'
    );
  }

  console.log('[CARRINHO] Checkout indisponível com carrinho vazio.');
});

// ==================================================
// CHECKOUT POSITIVO
// ==================================================

Given('que tenho um produto no carrinho', async function () {
  await prepararProdutoNoCarrinho.call(this);
});

Given('acesso o checkout', async function () {
  await this.cartCheckoutPage.proceedToCheckout();

  console.log('[CHECKOUT] Página de checkout acessada.');
});

// ==================================================
// ENDEREÇO DE ENTREGA
// ==================================================

When(
  'preencho os dados pessoais e o endereço de entrega',
  async function () {
    const endereco = this.page.locator('#address_delivery');

    await endereco.waitFor({
      state: 'visible',
      timeout: 10000
    });

    const texto = (await endereco.innerText()).trim();

    if (!texto) {
      throw new Error(
        'Endereço de entrega não encontrado.'
      );
    }

    console.log('[CHECKOUT] Dados de entrega identificados.');
  }
);

Then(
  'devo visualizar o endereço de entrega cadastrado',
  async function () {
    const endereco = this.page.locator('#address_delivery');

    await endereco.waitFor({
      state: 'visible',
      timeout: 10000
    });

    const texto = (await endereco.innerText()).trim();

    if (!texto) {
      throw new Error(
        'Endereço de entrega não está sendo exibido.'
      );
    }

    console.log('[CHECKOUT] Endereço de entrega exibido.');
  }
);

// ==================================================
// PAGAMENTO POSITIVO
// ==================================================

When(
  'preencho o formulário de pagamento com dados válidos',
  async function () {
    const dados = validarDadosPagamento();

    await this.cartCheckoutPage.openPaymentForm();

    await this.cartCheckoutPage.fillPayment(dados);

    console.log('[PAGAMENTO] Dados de pagamento preenchidos.');
  }
);

When('confirmo o pedido', async function () {
  await this.cartCheckoutPage.pay();

  console.log('[PAGAMENTO] Pedido enviado para confirmação.');
});

Then('devo visualizar a confirmação da compra', async function () {
  await this.cartCheckoutPage.orderSuccessMessage.waitFor({
    state: 'visible',
    timeout: 15000
  });

  console.log('[CHECKOUT] Compra realizada com sucesso.');
});
