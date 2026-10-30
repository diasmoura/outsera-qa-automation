
class ProductsPage {
  constructor(page) {
    this.page = page;

    this.timeout = 15000;
    this.baseUrl = 'https://automationexercise.com';

    // ==============================================
    // PRODUTOS
    // ==============================================

    this.productCards = this.page.locator('.product-image-wrapper');
    this.firstProduct = this.productCards.first();

    this.addToCartButton = this.firstProduct
      .locator('a.add-to-cart')
      .first();

    // ==============================================
    // MODAL DE CONFIRMAÇÃO
    // ==============================================

    this.addedModal = this.page.locator('#cartModal');

    this.addedMessage = this.addedModal.getByText('Added!', {
      exact: true
    });

    this.viewCartLink = this.addedModal.getByRole('link', {
      name: 'View Cart'
    });

    // ==============================================
    // CARRINHO
    // ==============================================

    this.cartProductRows = this.page.locator(
      '#cart_info_table tbody tr'
    );

    this.emptyCartMessage = this.page.locator('#empty_cart');

    this.proceedToCheckoutButton = this.page.locator(
      '.btn.btn-default.check_out'
    );
  }

  // ==============================================
  // AGUARDAR PÁGINA DO CARRINHO
  // ==============================================

  async waitForCartPage() {
    await this.page.waitForURL('**/view_cart', {
      timeout: this.timeout
    });

    await this.page.waitForLoadState('domcontentloaded');

    await this.page.locator(
      '#cart_info_table, #empty_cart'
    ).first().waitFor({
      state: 'attached',
      timeout: this.timeout
    });
  }

  // ==============================================
  // VERIFICAR PRODUTOS NO CARRINHO
  // ==============================================

  async getCartProductCount() {
    await this.waitForCartPage();

    return await this.cartProductRows.count();
  }

  // ==============================================
  // ADICIONAR PRIMEIRO PRODUTO AO CARRINHO
  // ==============================================

  async addFirstProductToCart() {
    try {
      // Garante que está na página de produtos
      if (!this.page.url().includes('/products')) {
        await this.page.goto(`${this.baseUrl}/products`, {
          waitUntil: 'domcontentloaded',
          timeout: this.timeout
        });
      }

      // Aguarda a lista de produtos
      await this.firstProduct.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      await this.firstProduct.scrollIntoViewIfNeeded();

      // Exibe o botão Add to cart
      await this.firstProduct.hover();

      await this.addToCartButton.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      if (!(await this.addToCartButton.isEnabled())) {
        throw new Error('Botão Add to cart está desabilitado.');
      }

      // Realiza a inclusão
      await this.addToCartButton.click();

      console.log(
        '[CARRINHO] Clique em Add to cart realizado.'
      );

      // Aguarda o modal sem interromper o fluxo caso ele não apareça
      const modalOpened = await this.addedModal.waitFor({
        state: 'visible',
        timeout: 10000
      }).then(() => true).catch(() => false);

      if (modalOpened) {
        await this.addedMessage.waitFor({
          state: 'visible',
          timeout: 5000
        });

        console.log(
          '[CARRINHO] Confirmação de inclusão exibida.'
        );

        return true;
      }

      console.warn(
        '[CARRINHO] Modal não exibido. Validando inclusão diretamente no carrinho.'
      );

      // Não realiza outro clique para evitar duplicidade
      await this.page.goto(`${this.baseUrl}/view_cart`, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      });

      await this.waitForCartPage();

      const productCount = await this.cartProductRows.count();

      console.log(
        `[CARRINHO] Produtos encontrados após inclusão: ${productCount}.`
      );

      if (productCount > 0) {
        console.log(
          '[CARRINHO] Produto identificado no carrinho.'
        );

        return true;
      }

      throw new Error(
        'O modal não foi exibido e nenhum produto foi encontrado no carrinho.'
      );

    } catch (error) {
      throw new Error(
        `[CARRINHO] Falha ao adicionar o primeiro produto. ` +
        `URL: ${this.page.url()}. Detalhe: ${error.message}`
      );
    }
  }

  // ==============================================
  // ACESSAR CARRINHO
  // ==============================================

  async openCartFromConfirmation() {
    try {
      // Se já estiver no carrinho, não navega novamente
      if (this.page.url().includes('/view_cart')) {
        await this.waitForCartPage();

        console.log(
          '[CARRINHO] Já está na página do carrinho.'
        );

        return;
      }

      const modalVisible = await this.addedModal
        .isVisible()
        .catch(() => false);

      const cartLinkVisible = modalVisible
        ? await this.viewCartLink.isVisible().catch(() => false)
        : false;

      if (cartLinkVisible) {
        await this.viewCartLink.click();

        console.log(
          '[CARRINHO] Acessando carrinho pelo modal de confirmação.'
        );
      } else {
        await this.page.goto(`${this.baseUrl}/view_cart`, {
          waitUntil: 'domcontentloaded',
          timeout: this.timeout
        });

        console.log(
          '[CARRINHO] Acessando carrinho diretamente.'
        );
      }

      await this.waitForCartPage();

      console.log(
        '[CARRINHO] Página do carrinho acessada com sucesso.'
      );

    } catch (error) {
      throw new Error(
        `[CARRINHO] Falha ao acessar o carrinho. ` +
        `URL: ${this.page.url()}. Detalhe: ${error.message}`
      );
    }
  }

  // ==============================================
  // VALIDAR PRODUTO NO CARRINHO
  // ==============================================

  async isProductVisibleInCart() {
    try {
      await this.waitForCartPage();

      const productCount = await this.cartProductRows.count();

      console.log(
        `[CARRINHO] Quantidade de produtos encontrados: ${productCount}.`
      );

      if (productCount === 0) {
        return false;
      }

      return await this.cartProductRows
        .first()
        .isVisible()
        .catch(() => false);

    } catch (error) {
      console.error(
        `[CARRINHO] Falha ao validar produto no carrinho: ${error.message}`
      );

      return false;
    }
  }

  // ==============================================
  // VALIDAR CARRINHO VAZIO
  // ==============================================

  async isCartEmpty() {
    try {
      await this.waitForCartPage();

      const productCount = await this.cartProductRows.count();

      const emptyMessageVisible = await this.emptyCartMessage
        .isVisible()
        .catch(() => false);

      const isEmpty =
        productCount === 0 && emptyMessageVisible;

      console.log(
        `[CARRINHO] Carrinho vazio: ${isEmpty ? 'SIM' : 'NÃO'}.`
      );

      return isEmpty;

    } catch (error) {
      throw new Error(
        `[CARRINHO] Falha ao validar carrinho vazio. ` +
        `URL: ${this.page.url()}. Detalhe: ${error.message}`
      );
    }
  }

  // ==============================================
  // VALIDAR DISPONIBILIDADE DO CHECKOUT
  // ==============================================

  async isCheckoutAvailable() {
    try {
      await this.waitForCartPage();

      const checkoutVisible = await this.proceedToCheckoutButton
        .isVisible()
        .catch(() => false);

      console.log(
        `[CHECKOUT] Botão disponível: ${checkoutVisible ? 'SIM' : 'NÃO'}.`
      );

      return checkoutVisible;

    } catch (error) {
      throw new Error(
        `[CHECKOUT] Falha ao verificar disponibilidade do checkout. ` +
        `URL: ${this.page.url()}. Detalhe: ${error.message}`
      );
    }
  }

  // ==============================================
  // PROSSEGUIR PARA CHECKOUT
  // ==============================================

  async proceedToCheckout() {
    try {
      await this.waitForCartPage();

      const checkoutAvailable = await this.isCheckoutAvailable();

      if (!checkoutAvailable) {
        throw new Error(
          'O botão Proceed To Checkout não está disponível.'
        );
      }

      await this.proceedToCheckoutButton.click();

      console.log(
        '[CHECKOUT] Clique em Proceed To Checkout realizado.'
      );

      return true;

    } catch (error) {
      throw new Error(
        `[CHECKOUT] Falha ao prosseguir para checkout. ` +
        `URL: ${this.page.url()}. Detalhe: ${error.message}`
      );
    }
  }
}

module.exports = { ProductsPage };
