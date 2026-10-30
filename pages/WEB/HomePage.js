
class HomePage {
  constructor(page) {
    this.page = page;

    // Navegação principal
    this.signupLoginLink = page.getByRole('link', {
      name: /signup\s*\/\s*login/i
    });

    this.productsLink = page.getByRole('link', {
      name: /products/i
    });

    this.cartLink = page.getByRole('link', {
      name: /cart/i
    });

    this.homeLink = page.getByRole('link', {
      name: /^home$/i
    });
  }

  // Acessar página inicial
  async open() {
    await this.page.goto(
      'https://automationexercise.com/',
      { waitUntil: 'domcontentloaded' }
    );
  }

  // Acessar login
  async openLogin() {
    await this.signupLoginLink.waitFor({
      state: 'visible'
    });

    await this.signupLoginLink.click();
  }

  // Acessar produtos
  async openProducts() {
    await this.productsLink.waitFor({
      state: 'visible'
    });

    await this.productsLink.click();
  }

  // Acessar carrinho
  async openCart() {
    await this.cartLink.waitFor({
      state: 'visible'
    });

    await this.cartLink.click();
  }

  // Voltar para Home
  async returnHome() {
    await this.homeLink.click();
  }

  // Validar página inicial
  async isHomeVisible() {
    return await this.homeLink.isVisible();
  }
}

module.exports = { HomePage };
