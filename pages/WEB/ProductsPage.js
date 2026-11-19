
class ProductsPage {
  constructor(page) {
    this.page = page;
    this.timeout = 20000;
    this.baseUrl = 'https://automationexercise.com';

    // Lista de produtos
    this.featuresItems = this.page.locator('.features_items');

    this.productCards = this.page.locator(
      '.features_items .product-image-wrapper:visible'
    );

    this.firstProduct = this.productCards.first();

    // Primeiro botão Add to cart do primeiro produto
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

    // Endereço de entrega no checkout
    this.deliveryAddress = this.page.locator('#address_delivery');
  }

  /**
   * Verifica se a URL atual corresponde à página de produtos.
   */
  isProductsPage() {
    try {
      const url = new URL(this.page.url());

      return (
        url.hostname === 'automationexercise.com' &&
        url.pathname.replace(/\/+$/, '') === '/products'
      );
    } catch {
      return false;
    }
  }

  /**
   * Acessa a página de produtos e valida seu carregamento.
   */
  async ensureProductsPage() {
    let ultimoErro;

    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        console.log(
          `[PRODUTOS] Tentativa ${tentativa} de carregamento.`
        );

        if (!this.isProductsPage()) {
          const response = await this.page.goto(
            `${this.baseUrl}/products`,
            {
              waitUntil: 'domcontentloaded',
              timeout: this.timeout
            }
          );

          if (response && !response.ok()) {
            throw new Error(
              `A página retornou HTTP ${response.status()}.`
            );
          }
        } else if (tentativa > 1) {
          await this.page.reload({
            waitUntil: 'domcontentloaded',
            timeout: this.timeout
          });
        }

        if (!this.isProductsPage()) {
          throw new Error(
            `URL inesperada: ${this.page.url()}`
          );
        }

        // Aguarda a área principal dos produtos.
        await this.featuresItems.waitFor({
          state: 'visible',
          timeout: this.timeout
        });

        // Aguarda o primeiro card efetivamente visível.
        await this.firstProduct.waitFor({
          state: 'visible',
          timeout: this.timeout
        });

        const quantidade = await this.productCards.count();

        if (quantidade === 0) {
          throw new Error(
            'A área de produtos foi carregada, mas nenhum card visível foi encontrado.'
          );
        }

        console.log(
          `[PRODUTOS] ${quantidade} produtos visíveis carregados.`
        );

        return true;

      } catch (error) {
        ultimoErro = error;

        console.warn(
          `[PRODUTOS] Tentativa ${tentativa} falhou: ${error.message}`
        );

        if (tentativa === 2) {
          break;
        }
      }
    }

    const titulo = await this.page.title().catch(() => 'Indisponível');

    throw new Error(
      '[PRODUTOS] Falha ao carregar a lista de produtos. ' +
      `URL atual: ${this.page.url()}. ` +
      `Título: ${titulo}. ` +
      `Detalhe: ${ultimoErro ? ultimoErro.message : 'Erro não identificado'}.`,
      { cause: ultimoErro }
    );
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
   * Utiliza o modal quando disponível.
   * Caso contrário, navega diretamente para o carrinho.
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

      await this.page.waitForURL(
        /\/view_cart(?:[/?#]|$)/,
        { timeout: this.timeout }
      );

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

    console.log(
      '[CARRINHO] Página do carrinho acessada.'
    );

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

    try {
      await Promise.any([
        this.cartTable.waitFor({
          state: 'visible',
          timeout: this.timeout
        }),

        this.emptyCartMessage.waitFor({
          state: 'visible',
          timeout: this.timeout
        })
      ]);
    } catch (error) {
      throw new Error(
        '[CARRINHO] A página foi carregada, mas não foi possível ' +
        'identificar a tabela de produtos ou a mensagem de carrinho vazio. ' +
        `URL: ${this.page.url()}. ` +
        `Detalhe: ${error.message}`,
        { cause: error }
      );
    }

    return true;
  }

  /**
   * Retorna a quantidade de produtos no carrinho.
   */
  async getCartProductCount() {
    await this.waitForCartPage();

    return this.cartRows.count();
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
   * Aguarda a navegação e a renderização do endereço de entrega.
   */
  async proceedToCheckout() {
    await this.waitForCartPage();

    const disponivel = await this.isCheckoutAvailable();

    if (!disponivel) {
      throw new Error(
        '[CHECKOUT] Botão indisponível. ' +
        'Verifique se o carrinho possui produtos.'
      );
    }

    try {
      // Registra a espera antes do clique para não perder
      // o evento de navegação no WebKit.
      const navegacao = this.page.waitForURL(
        url => (
          url.pathname.replace(/\/+$/, '').endsWith('/checkout')
        ),
        {
          waitUntil: 'domcontentloaded',
          timeout: this.timeout
        }
      );

      await this.checkoutButton.click();

      await navegacao;

      // Aguarda o conteúdo real do checkout.
      await this.deliveryAddress.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      console.log(
        `[CHECKOUT] Página carregada e estabilizada. URL atual: ${this.page.url()}`
      );

      return true;

    } catch (error) {
      throw new Error(
        '[CHECKOUT] Falha ao acessar ou estabilizar a página. ' +
        `URL atual: ${this.page.url()}. ` +
        `Detalhe: ${error.message}`,
        { cause: error }
      );
    }
  }
}

module.exports = ProductsPage;
