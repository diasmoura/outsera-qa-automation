
class HomePage {
  constructor(page) {
    this.page = page;
    this.signupLoginLink = page.getByRole('link', {
      name: /signup \/ login/i
    });
    this.productsLink = page.getByRole('link', {
      name: /products/i
    });
    this.cartLink = page.getByRole('link', {
      name: /cart/i
    });
  }

  async open() {
    await this.page.goto('https://automationexercise.com/');
  }

  async openLogin() {
    await this.signupLoginLink.click();
  }

  async openProducts() {
    await this.productsLink.click();
  }

  async openCart() {
    await this.cartLink.click();
  }
}

module.exports = { HomePage };
