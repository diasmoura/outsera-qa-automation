
class CartCheckoutPage {
  constructor(page) {
    this.page = page;

    // Carrinho e checkout
    this.proceedToCheckoutButton = page.getByText(
      'Proceed To Checkout',
      { exact: true }
    );

    this.placeOrderLink = page.locator('a[href="/payment"]');

    // Campos de pagamento
    this.nameOnCard = page.locator('input[name="name_on_card"]');
    this.cardNumber = page.locator('input[name="card_number"]');
    this.cvc = page.locator('input[name="cvc"]');
    this.expiryMonth = page.locator('input[name="expiry_month"]');
    this.expiryYear = page.locator('input[name="expiry_year"]');

    this.payButton = page.getByRole('button', {
      name: /pay and confirm order/i
    });

    // Confirmação do pedido
    this.orderSuccessMessage = page.getByText(
      'Order Placed!',
      { exact: true }
    );
  }

  // Avança para o checkout com usuário autenticado
  async proceedToCheckout() {
    await this.proceedToCheckoutButton.waitFor({
      state: 'visible',
      timeout: 10000
    });

    await this.proceedToCheckoutButton.click();

    await this.placeOrderLink.waitFor({
      state: 'visible',
      timeout: 10000
    });
  }

  // Abre a tela de pagamento
  async openPaymentForm() {
    await this.placeOrderLink.waitFor({
      state: 'visible',
      timeout: 10000
    });

    await this.placeOrderLink.click();

    await this.page.waitForURL('**/payment', {
      timeout: 10000
    });

    await this.cardNumber.waitFor({
      state: 'visible',
      timeout: 10000
    });
  }

  // Preenche os dados do cartão
  async fillPayment(data) {
    await this.nameOnCard.fill(data.name);
    await this.cardNumber.fill(data.cardNumber);
    await this.cvc.fill(data.cvc);
    await this.expiryMonth.fill(data.expiryMonth);
    await this.expiryYear.fill(data.expiryYear);
  }

  // Limpa todos os campos de pagamento
  async clearPaymentFields() {
    await this.nameOnCard.fill('');
    await this.cardNumber.fill('');
    await this.cvc.fill('');
    await this.expiryMonth.fill('');
    await this.expiryYear.fill('');
  }

  // Realiza o pagamento
  async pay() {
    await this.payButton.click();
  }

  // Verifica se o pedido foi confirmado
  async isOrderConfirmed() {
    return this.orderSuccessMessage
      .isVisible()
      .catch(() => false);
  }

  // Verifica a validade HTML do formulário
  async isPaymentFormValid() {
    return this.cardNumber.evaluate(
      element => element.form.checkValidity()
    );
  }

  // Retorna os nomes dos campos que estão vazios
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
