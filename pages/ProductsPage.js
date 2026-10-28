
class ProductsPage {
  constructor(page) {
    this.page = page;
    this.firstProduct = page.locator('.product-image-wrapper').first();
    this.addedModal = page.locator('.modal-content')
      .filter({ has: page.locator('.modal-title', { hasText: 'Added!' }) });
  }

  async addFirstProductToCart() {
    let etapa = 'aguardando o primeiro produto';

    try {
      await this.firstProduct.waitFor({
        state: 'visible',
        timeout: 8000
      });

      const addToCartButton = this.firstProduct
        .locator('a.add-to-cart')
        .first();

      etapa = 'posicionando o mouse sobre o produto';
      await this.firstProduct.hover({ timeout: 5000 });

      etapa = 'aguardando o botão de adicionar ao carrinho';
      await addToCartButton.waitFor({
        state: 'visible',
        timeout: 5000
      });

      etapa = 'clicando em adicionar ao carrinho';
      await addToCartButton.click({ timeout: 5000 });

      etapa = 'aguardando o modal de confirmação';
      await this.addedModal.waitFor({
        state: 'visible',
        timeout: 10000
      });

      console.log('Confirmação de inclusão do produto exibida.');
    } catch (error) {
      throw new Error(
        `Falha ao adicionar produto ao carrinho. ` +
        `Etapa: ${etapa}. URL atual: ${this.page.url()}. ` +
        `Detalhe: ${error.message}`
      );
    }
  }

  async openCartFromConfirmation() {
    const viewCartButton = this.page
      .getByRole('link', { name: 'View Cart' })
      .first();

    await viewCartButton.waitFor({
      state: 'visible',
      timeout: 10000
    });

    await viewCartButton.click({ timeout: 5000 });
  }

  async isProductVisibleInCart() {
    await this.page.waitForURL('**/view_cart', {
      timeout: 10000
    });

    const cartProduct = this.page
      .locator('#cart_info_table tbody tr')
      .first();

    await cartProduct.waitFor({
      state: 'visible',
      timeout: 8000
    });

    return cartProduct.isVisible();
  }
}

module.exports = { ProductsPage };
