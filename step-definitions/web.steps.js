
const { Given, When, Then } = require('@cucumber/cucumber');
const { HomePage } = require('../pages/HomePage');
const { AuthPage } = require('../pages/AuthPage');
const { ProductsPage } = require('../pages/ProductsPage');
const { CartCheckoutPage } = require('../pages/CartCheckoutPage');

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


Then('devo conseguir visualizar o carrinho', async function () {
  await this.productsPage.openCartFromConfirmation();

  const productVisible = await this.productsPage.isProductVisibleInCart();

  if (!productVisible) {
    throw new Error('O produto não foi encontrado no carrinho.');
  }
});


When('acesso a opção de login', async function () {
  await this.homePage.openLogin();
});

Then('devo visualizar o formulário de login', async function () {
  this.authPage = new AuthPage(this.page);

  await this.page.waitForURL('**/login');
  const visible = await this.authPage.isLoginVisible();

  if (!visible) {
    throw new Error('O formulário de login não está visível.');
  }
});
