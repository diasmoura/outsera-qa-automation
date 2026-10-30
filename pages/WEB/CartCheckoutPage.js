
class CartCheckoutPage {
  constructor(page) {
    this.page = page;
    this.timeout = 20000;

    // Checkout
    this.proceedToCheckoutButton = page.getByText(
      'Proceed To Checkout',
      { exact: true }
    );

    this.placeOrderLink = page.locator('a[href="/payment"]');

    // Endereço de entrega
    this.deliveryAddress = page.locator('#address_delivery');

    this.deliveryAddressDetails = page.locator(
      '#address_delivery .address_firstname, ' +
      '#address_delivery .address_address1, ' +
      '#address_delivery .address_address2, ' +
      '#address_delivery .address_city, ' +
      '#address_delivery .address_state_name, ' +
      '#address_delivery .address_country_name, ' +
      '#address_delivery .address_phone'
    );

    // Endereço de cobrança
    this.billingAddress = page.locator('#address_invoice');

    // Pagamento
    this.nameOnCard = page.locator('input[name="name_on_card"]');
    this.cardNumber = page.locator('input[name="card_number"]');
    this.cvc = page.locator('input[name="cvc"]');
    this.expiryMonth = page.locator('input[name="expiry_month"]');
    this.expiryYear = page.locator('input[name="expiry_year"]');

    this.payButton = page.getByRole('button', {
      name: /pay and confirm order/i
    });

    // Confirmação
    this.orderSuccessMessage = page.getByText(
      'Order Placed!',
      { exact: true }
    );

    this.orderConfirmationDetails = page.getByText(
      /your order has been placed successfully/i
    );
  }

  /**
   * Avança para o checkout.
   */
  async proceedToCheckout() {
    await this.proceedToCheckoutButton.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    await this.proceedToCheckoutButton.click();

    await this.deliveryAddress.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    return true;
  }

  /**
   * Valida os dados de entrega do usuário autenticado.
   * O endereço é recuperado dos dados cadastrados na conta.
   */
  async fillDeliveryDetails(data = {}) {
    if (!data.email || !data.senha) {
      throw new Error(
        'Credenciais não informadas para validar os dados de entrega.'
      );
    }

    const loggedIn = this.page.getByText(/logged in as/i);

    await loggedIn.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    await this.deliveryAddress.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    const enderecoValido = await this.validateDeliveryAddress();

    if (!enderecoValido) {
      throw new Error(
        'O endereço de entrega não possui dados suficientes cadastrados.'
      );
    }

    console.log(
      '[CHECKOUT] Endereço de entrega carregado da conta autenticada.'
    );

    return true;
  }

  /**
   * Valida se o endereço de entrega está visível e preenchido.
   */
  async validateDeliveryAddress() {
    await this.deliveryAddress.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    const quantidade = await this.deliveryAddressDetails.count();

    if (quantidade === 0) {
      console.error(
        '[CHECKOUT] Nenhum campo de endereço foi encontrado.'
      );
      return false;
    }

    let camposPreenchidos = 0;

    for (let i = 0; i < quantidade; i++) {
      const campo = this.deliveryAddressDetails.nth(i);

      const texto = (
        await campo.innerText().catch(() => '')
      ).trim();

      if (texto.length > 0) {
        camposPreenchidos++;
      }
    }

    console.log(
      `[CHECKOUT] Campos de endereço preenchidos: ${camposPreenchidos}.`
    );

    return camposPreenchidos >= 3;
  }

  /**
   * Abre a tela de pagamento.
   */
  async openPaymentForm() {
    await this.placeOrderLink.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    await this.placeOrderLink.click();

    await this.page.waitForURL('**/payment', {
      timeout: this.timeout
    });

    await this.cardNumber.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    return true;
  }

  /**
   * Preenche os dados do cartão.
   */
  async fillPayment(data = {}) {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados de pagamento inválidos.');
    }

    const campos = [
      {
        nome: 'Nome do titular',
        locator: this.nameOnCard,
        valor: data.name
      },
      {
        nome: 'Número do cartão',
        locator: this.cardNumber,
        valor: data.cardNumber
      },
      {
        nome: 'CVC',
        locator: this.cvc,
        valor: data.cvc
      },
      {
        nome: 'Mês de validade',
        locator: this.expiryMonth,
        valor: data.expiryMonth
      },
      {
        nome: 'Ano de validade',
        locator: this.expiryYear,
        valor: data.expiryYear
      }
    ];

    for (const campo of campos) {
      if (
        campo.valor === undefined ||
        campo.valor === null ||
        String(campo.valor).trim() === ''
      ) {
        throw new Error(
          `Dado de pagamento não informado: ${campo.nome}.`
        );
      }

      await campo.locator.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      await campo.locator.fill(String(campo.valor));
    }

    console.log('[PAGAMENTO] Dados do cartão preenchidos.');

    return true;
  }

  /**
   * Compatibilidade com checkout.steps.js.
   */
  async fillPaymentForm(data) {
    return this.fillPayment(data);
  }

  /**
   * Limpa os campos de pagamento.
   */
  async clearPaymentFields() {
    await this.nameOnCard.fill('');
    await this.cardNumber.fill('');
    await this.cvc.fill('');
    await this.expiryMonth.fill('');
    await this.expiryYear.fill('');

    return true;
  }

  /**
   * Realiza o pagamento.
   */
  async pay() {
    await this.payButton.waitFor({
      state: 'visible',
      timeout: this.timeout
    });

    await this.payButton.click();

    return true;
  }

  /**
   * Compatibilidade com checkout.steps.js.
   */
  async placeOrder() {
    return this.pay();
  }

  /**
   * Verifica se o pedido foi confirmado.
   */
  async isOrderConfirmed() {
    try {
      await this.orderSuccessMessage.waitFor({
        state: 'visible',
        timeout: this.timeout
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica a validade HTML do formulário.
   */
  async isPaymentFormValid() {
    return this.cardNumber.evaluate(
      element => element.form.checkValidity()
    );
  }

  /**
   * Retorna os nomes dos campos de pagamento vazios.
   */
  async getEmptyPaymentFields() {
    const fields = [
      { name: 'Nome do titular', locator: this.nameOnCard },
      { name: 'Número do cartão', locator: this.cardNumber },
      { name: 'CVC', locator: this.cvc },
      { name: 'Mês de validade', locator: this.expiryMonth },
      { name: 'Ano de validade', locator: this.expiryYear }
    ];

    const emptyFields = [];

    for (const field of fields) {
      const value = await field.locator.inputValue();

      if (value.trim() === '') {
        emptyFields.push(field.name);
      }
    }

    return emptyFields;
  }
}

module.exports = { CartCheckoutPage };
