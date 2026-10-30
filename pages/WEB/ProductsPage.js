
class ProductsPage {
  constructor(page) {
    this.page = page;

    this.timeout = 15000;
    this.baseUrl = 'https://automationexercise.com';

    // ==============================================
    // PRODUTOS
    // ==============================================

    this.productCards = page.locator('.product-image-wrapper');
    this.firstProduct = this.productCards.first();

    this.addToCartButton = this.firstProduct
      .locator('a.add-to-cart')
      .first();

    // ==============================================
    // MODAL DE CONFIRMAÇÃO
    // ==============================================

    this.addedModal = page.locator('#cartModal');

    this.addedMessage = this.addedModal.getByText('Added!', {
      exact: true
    });

    this.viewCartLink = this.addedModal.getByRole('link', {
      name: 'View Cart'
    });

    // ==============================================
    // CARRINHO
    // ==============================================

    this.cartProductRows = page.locator(
      '#cart_info_table tbody tr'
    );

    this.emptyCartMessage = page.locator('#empty_cart');

    this.proceedToCheckoutButton = page.locator(
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

    await this.page.locator(
      '#cart_info_table, #empty_cart'
    ).first().waitFor({
      state: 'attached',
      timeout: this.timeout
    });
  }

  // ==============================================
  // QUANTIDADE DE PRODUTOS
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
      if (!this.page.url().includes('/products')) {
        await this.page.goto(`${this.baseUrl}/products`, {
          waitUntil: 'domcontentloaded',
          timeout: this.timeout
        });
      }

      await this.firstProduct.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      await this.firstProduct.scrollIntoViewIfNeeded();
      await this.firstProduct.hover();

      await this.addToCartButton.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      if (!(await this.addToCartButton.isEnabled())) {
        throw new Error('Botão Add to cart está desabilitado.');
      }

      // Aguarda a resposta da requisição de inclusão.
      // O listener é registrado antes do clique.
      const respostaInclusao = this.page.waitForResponse(
        response => {
          const url = response.url();

          return (
            url.includes('/add_to_cart/') &&
            response.request().method() === 'POST'
          );
        },
        { timeout: this.timeout }
      ).catch(() => null);

      await this.addToCartButton.click();

      console.log(
        '[CARRINHO] Clique em Add to cart realizado.'
      );

      const response = await respostaInclusao;

      if (response && !response.ok()) {
        throw new Error(
          `Requisição de inclusão retornou HTTP ${response.status()}.`
        );
      }

      if (response) {
        console.log(
          `[CARRINHO] Requisição de inclusão concluída: HTTP ${response.status()}.`
        );
      } else {
        console.warn(
          '[CARRINHO] Resposta da inclusão não identificada. Validando pela interface.'
        );
      }

      await this.addedModal.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      await this.addedMessage.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      console.log(
        '[CARRINHO] Confirmação de inclusão exibida.'
      );

      return true;

    } catch (error) {
      throw new Error(
        `[CARRINHO] Falha ao adicionar o primeiro produto. ` +
        `URL: ${this.page.url()}. Detalhe: ${error.message}`
      );
    }
  }

  // ==============================================
  // VALIDAR CONFIRMAÇÃO
  // ==============================================

  async isAddToCartConfirmationVisible() {
    try {
      await this.addedModal.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      await this.addedMessage.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      return true;

    } catch {
      return false;
    }
  }

  // ==============================================
  // ACESSAR CARRINHO
  // ==============================================

  async openCartFromConfirmation() {
    try {
      if (this.page.url().includes('/view_cart')) {
        await this.waitForCartPage();

        console.log(
          '[CARRINHO] Já está na página do carrinho.'
        );

        return true;
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
        // Acesso direto para cenários sem modal.
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

      return true;

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

      const quantidade = await this.cartProductRows.count();

      console.log(
        `[CARRINHO] Quantidade de produtos encontrados: ${quantidade}.`
      );

      if (quantidade === 0) {
        console.error(
          '[CARRINHO] Nenhum produto encontrado após a inclusão.'
        );

        return false;
      }

      const produtoVisivel = await this.cartProductRows
        .first()
        .isVisible();

      if (produtoVisivel) {
        console.log(
          '[CARRINHO] Produto encontrado no carrinho.'
        );
      }

      return produtoVisivel;

    } catch (error) {
      console.error(
        `[CARRINHO] Falha na validação: ${error.message}`
      );

      return false;
    }
  }

  // ==============================================
  // VALIDAR CARRINHO VAZIO
  // ==============================================

  async isCartEmpty() {
    await this.waitForCartPage();

    const quantidade = await this.cartProductRows.count();

    const mensagemVisivel = await this.emptyCartMessage
      .isVisible()
      .catch(() => false);

    const carrinhoVazio =
      quantidade === 0 && mensagemVisivel;

    console.log(
      `[CARRINHO] Carrinho vazio: ${carrinhoVazio ? 'SIM' : 'NÃO'}.`
    );

    return carrinhoVazio;
  }

  // ==============================================
  // VALIDAR DISPONIBILIDADE DO CHECKOUT
  // ==============================================

  async isCheckoutAvailable() {
    await this.waitForCartPage();

    const disponivel = await this.proceedToCheckoutButton
      .isVisible()
      .catch(() => false);

    console.log(
      `[CHECKOUT] Botão disponível: ${disponivel ? 'SIM' : 'NÃO'}.`
    );

    return disponivel;
  }

  // ==============================================
  // PROSSEGUIR PARA CHECKOUT
  // ==============================================

  async proceedToCheckout() {
    try {
      await this.waitForCartPage();

      const disponivel = await this.isCheckoutAvailable();

      if (!disponivel) {
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
