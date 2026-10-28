
class CartCheckoutPage {
  constructor(page) {
    this.page = page;
    this.proceedToCheckoutButton = page.getByText(
      'Proceed To Checkout',
      { exact: true }
    );
    this.registerLoginLink = page.getByRole('link', {
      name: /register \/ login/i
    });
    this.placeOrderLink = page.getByRole('link', {
      name: /place order/i
    });
    this.nameOnCard = page.locator(
      'input[name="name_on_card"]'
    );
    this.cardNumber = page.locator(
      'input[name="card_number"]'
    );
    this.cvc = page.locator('input[name="cvc"]');
    this.expiryMonth = page.locator(
      'input[name="expiry_month"]'
    );
    this.expiryYear = page.locator(
      'input[name="expiry_year"]'
    );
    this.payButton = page.getByRole('button', {
      name: /pay and confirm order/i
    });
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }

  async openRegistrationLogin() {
    await this.registerLoginLink.click();
  }

  async openPaymentForm() {
    await this.placeOrderLink.click();
  }

  async fillPayment(data) {
    await this.nameOnCard.fill(data.name);
    await this.cardNumber.fill(data.cardNumber);
    await this.cvc.fill(data.cvc);
    await this.expiryMonth.fill(data.expiryMonth);
    await this.expiryYear.fill(data.expiryYear);
  }

  async pay() {
    await this.payButton.click();
  }
}

module.exports = { CartCheckoutPage };
