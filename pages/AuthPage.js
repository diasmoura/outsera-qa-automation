
class AuthPage {
  constructor(page) {
    this.page = page;
    this.loginHeading = page.getByRole('heading', {
      name: /login to your account/i
    });
    this.emailInput = page.locator(
      'form[action="/login"] input[name="email"]'
    );
    this.passwordInput = page.locator(
      'form[action="/login"] input[name="password"]'
    );
    this.loginButton = page.locator(
      'form[action="/login"] button[type="submit"]'
    );
    this.loginError = page.locator(
      'form[action="/login"] p'
    );
  }

  async login(email, password) {
    if (email !== '') {
      await this.emailInput.fill(email);
    }

    if (password !== '') {
      await this.passwordInput.fill(password);
    }

    await this.loginButton.click();
  }

  async isLoginVisible() {
    return await this.loginHeading.isVisible();
  }

  async getErrorMessage() {
    return (await this.loginError.first().textContent())?.trim() || '';
  }
}

module.exports = { AuthPage };
