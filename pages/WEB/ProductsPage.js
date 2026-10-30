
class ProductsPage {
  constructor(page) {
    this.page = page;
    this.timeout = 20000;
    this.baseUrl = 'https://automationexercise.com';

    // Lista de produtos
    this.productCards = this.page.locator(
      '.features_items .product-image-wrapper'
    );

    this.firstProduct = this.productCards.first();

    // O site apresenta dois botões Add to cart no primeiro card.
    // Utilizamos o primeiro para evitar strict mode violation.
    this.addToCartButton = this.firstProduct
      .locator('.add-to-cart')
      .first();

    // Modal de confirmação
    this.cartModal = this.page.locator('#cartModal');

    this.addedConfirmation = this.cartModal.getByText(
      'Added!',
      { exact: false }
    );

    this.viewCartButton = this.cartModal.locator(
      'a[href="/view_cart"]'
    ).first();

    // Carrinho
    this.cartTable = this.page.locator('#cart_info_table');

    this.cartRows = this.page.locator(
      '#cart_info_table tbody tr'
    );

    this.emptyCartMessage = this.page.locator('#empty_cart');

    // Checkout
    this.checkoutButton = this.page.locator(
      '.btn.btn-default.check_out'
    );
  }

  /**
   * Acessa a página de produtos e valida o carregamento.
   */
  async ensureProductsPage() {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        console.log(
          `[PRODUTOS] Tentativa ${tentativa} de carregamento.`
        );

        if (!this.page.url().includes('/products')) {
          await this.page.goto(`${this.baseUrl}/products`, {
            waitUntil: 'domcontentloaded',
            timeout: this.timeout
          });
        } else if (tentativa > 1) {
          await this.page.reload({
            waitUntil: 'domcontentloaded',
            timeout: this.timeout
          });
        }

        await this.firstProduct.waitFor({
          state: 'visible',
          timeout: this.timeout
        });

        const quantidade = await this.productCards.count();

        if (quantidade === 0) {
          throw new Error('Nenhum produto foi encontrado.');
        }

        console.log(
          `[PRODUTOS] ${quantidade} produtos carregados.`
        );

        return true;

      } catch (error) {
        console.warn(
          `[PRODUTOS] Tentativa ${tentativa} falhou: ${error.message}`
        );

        if (tentativa === 2) {
          throw new Error(
            `Falha ao carregar produtos: ${error.message}`
          );
        }
      }
    }
  }

  /**
   * Aguarda a página de produtos.
   */
  async waitForProducts() {
    return this.ensureProductsPage();
  }

  /**
   * Adiciona o primeiro produto ao carrinho.
   */
  async addFirstProductToCart() {
    await this.ensureProductsPage();

    await this.firstProduct.scrollIntoViewIfNeeded();

    await this.addToCartButton.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    await this.addToCartButton.click();

    await this.addedConfirmation.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    console.log(
      '[CARRINHO] Produto adicionado com sucesso.'
    );

    return true;
  }

  /**
   * Verifica a confirmação de inclusão do produto.
   */
  async isAddToCartConfirmationVisible() {
    try {
      await this.addedConfirmation.waitFor({
        state: 'visible',
        timeout: 10000
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Abre o carrinho.
   *
   * Se o modal estiver visível, utiliza o botão View Cart.
   * Se não estiver visível, acessa diretamente o carrinho.
   * Isso permite testar também o cenário de carrinho vazio.
   */
  async openCartFromConfirmation() {
    const modalVisivel = await this.cartModal.isVisible()
      .catch(() => false);

    if (modalVisivel) {
      await this.viewCartButton.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      await this.viewCartButton.click();

      await this.page.waitForURL(/view_cart/, {
        timeout: this.timeout
      });

    } else {
      console.log(
        '[CARRINHO] Modal não exibido. Acessando carrinho diretamente.'
      );

      await this.page.goto(`${this.baseUrl}/view_cart`, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      });
    }

    await this.waitForCartPage();

    console.log('[CARRINHO] Página do carrinho acessada.');

    return true;
  }

  /**
   * Aguarda o carregamento da página do carrinho.
   */
  async waitForCartPage() {
    if (!this.page.url().includes('view_cart')) {
      await this.page.goto(`${this.baseUrl}/view_cart`, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      });
    }

    await this.page.locator('body').waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    // Aguarda a tabela ou a mensagem de carrinho vazio.
    await Promise.race([
      this.cartTable.waitFor({
        state: 'visible',
        timeout: this.timeout
      }),
      this.emptyCartMessage.waitFor({
        state: 'visible',
        timeout: this.timeout
      })
    ]).catch(async () => {
      throw new Error(
        'A página do carrinho carregou, mas não foi possível identificar a tabela ou o estado vazio.'
      );
    });

    return true;
  }

  /**
   * Retorna a quantidade de produtos no carrinho.
   */
  async getCartProductCount() {
    await this.waitForCartPage();

    const quantidade = await this.cartRows.count();

    return quantidade;
  }

  /**
   * Verifica se existe produto no carrinho.
   */
  async isProductVisibleInCart() {
    const quantidade = await this.getCartProductCount();

    return quantidade > 0;
  }

  /**
   * Verifica se o carrinho está vazio.
   */
  async isCartEmpty() {
    const quantidade = await this.getCartProductCount();

    return quantidade === 0;
  }

  /**
   * Verifica se o botão de checkout está disponível.
   */
  async isCheckoutAvailable() {
    await this.waitForCartPage();

    return this.checkoutButton.isVisible()
      .catch(() => false);
  }

  /**
   * Prossegue para o checkout.
   */
  async proceedToCheckout() {
    await this.waitForCartPage();

    const disponivel = await this.isCheckoutAvailable();

    if (!disponivel) {
      throw new Error(
        'Botão de checkout indisponível. Verifique se o carrinho possui produtos.'
      );
    }

    await this.checkoutButton.click();

    await this.page.waitForLoadState('domcontentloaded');

    console.log('[CHECKOUT] Acessando checkout.');

    return true;
  }
}

module.exports = ProductsPage;
