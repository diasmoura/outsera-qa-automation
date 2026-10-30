
class HomePage {
  constructor(page) {
    this.page = page;

    this.productsLink = page.locator('a[href="/products"]').first();
    this.loginLink = page.locator('a[href="/login"]').first();
    this.cartLink = page.locator('a[href="/view_cart"]').first();
  }

  async open() {
    await this.page.goto('https://automationexercise.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await this.productsLink.waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  async openProducts() {
    await this.productsLink.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.productsLink.click();

    await this.page.waitForURL('**/products', {
      timeout: 30000
    });

    await this.page.locator(
      '.features_items .product-image-wrapper'
    ).first().waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  async openLogin() {
    await this.loginLink.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.loginLink.click();

    await this.page.waitForURL('**/login', {
      timeout: 30000
    });

    await this.page.getByText('Login to your account', {
      exact: true
    }).waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  async openCart() {
    await this.cartLink.waitFor({
      state: 'visible',
      timeout: 30000
    });

    await this.cartLink.click();

    await this.page.waitForURL('**/view_cart', {
      timeout: 30000
    });
  }

  async isHomeVisible() {
    return this.productsLink.isVisible().catch(() => false);
  }
}

module.exports = { HomePage };
