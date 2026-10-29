class ProductsPage {
  constructor(page) {
    this.page = page;

    this.firstProduct = page
      .locator('.product-image-wrapper')
      .first();

    this.addedModal = page.locator('#cartModal');
  }

  async addFirstProductToCart() {
    let etapa = 'aguardando o primeiro produto';

    try {
      await this.firstProduct.waitFor({
        state: 'visible',
        timeout: 15000
      });

      await this.firstProduct.scrollIntoViewIfNeeded();

      const addToCartButton = this.firstProduct
        .locator('a.add-to-cart')
        .first();

      etapa = 'posicionando o mouse sobre o produto';

      await this.firstProduct.hover({
        timeout: 10000
      });

      await addToCartButton.waitFor({
        state: 'visible',
        timeout: 10000
      });

      await addToCartButton.scrollIntoViewIfNeeded();

      etapa = 'clicando em adicionar ao carrinho';

      await addToCartButton.click({
        timeout: 10000
      });

      etapa = 'verificando o resultado do clique';

      // Aguarda a resposta do site sem presumir que o modal abriu.
      await this.page.waitForTimeout(1500);

      const modalVisivel = await this.addedModal.isVisible();

      if (!modalVisivel) {
        const botaoVisivel = await addToCartButton.isVisible().catch(() => false);

        const diagnostico = await this.page.evaluate(() => {
          const modal = document.querySelector('#cartModal');
          const botoes = Array.from(
            document.querySelectorAll('a.add-to-cart')
          );

          return {
            url: window.location.href,
            modalExiste: Boolean(modal),
            modalClasses: modal?.className ?? null,
            botoesAdicionar: botoes.length,
            mensagem: document.body.innerText
              .split('\n')
              .filter(texto =>
                /added|cart|success|adicionado|carrinho/i.test(texto)
              )
              .slice(0, 15)
          };
        });

        throw new Error(
          `O modal de confirmação não apareceu. ` +
          `Botão visível após clique: ${botaoVisivel}. ` +
          `Diagnóstico: ${JSON.stringify(diagnostico)}`
        );
      }

      etapa = 'validando a mensagem de confirmação';

      await this.addedModal
        .getByText('Added!', { exact: true })
        .waitFor({
          state: 'visible',
          timeout: 5000
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
    const viewCartButton = this.addedModal
      .getByRole('link', { name: 'View Cart' });

    await viewCartButton.waitFor({
      state: 'visible',
      timeout: 10000
    });

    await viewCartButton.click({
      timeout: 5000
    });
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