
class AuthPage {
  constructor(page) {
    this.page = page;

    this.loginHeading = page.getByRole('heading', {
      name: /login to your account/i
    });

    this.loginForm = page.locator('form[action="/login"]');

    this.emailInput = this.loginForm.locator(
      'input[data-qa="login-email"]'
    );

    this.passwordInput = this.loginForm.locator(
      'input[data-qa="login-password"]'
    );

    this.loginButton = this.loginForm.locator(
      'button[data-qa="login-button"]'
    );

    // A mensagem pode aparecer em diferentes posições do formulário.
    this.errorMessage = page.locator(
      '.login-form form p, form[action="/login"] p, .login-form p'
    );

    this.loggedInAs = page.getByText(/logged in as/i);
  }

  async acessarPagina() {
    const response = await this.page.goto(
      'https://automationexercise.com/login',
      {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      }
    );

    if (response && !response.ok()) {
      throw new Error(
        `[LOGIN] Falha ao acessar a página. HTTP ${response.status()}.`
      );
    }

    await this.loginHeading.waitFor({
      state: 'visible',
      timeout: 20000
    });

    await this.emailInput.waitFor({
      state: 'visible',
      timeout: 10000
    });

    await this.passwordInput.waitFor({
      state: 'visible',
      timeout: 10000
    });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async preencherEmail(email) {
    await this.emailInput.fill(email);
  }

  async preencherSenha(password) {
    await this.passwordInput.fill(password);
  }

  async clicarLogin() {
    await this.loginButton.click();
  }

  async isLoginVisible() {
    return this.loginHeading.isVisible();
  }

  async getErrorMessage() {
    const mensagemEsperada = this.errorMessage.filter({
      hasText: /incorrect|invalid|incorreto|incorreta|inválido|inválida/i
    });

    try {
      await mensagemEsperada.first().waitFor({
        state: 'visible',
        timeout: 10000
      });

      const mensagens = await mensagemEsperada.allInnerTexts();

      return mensagens
        .map(mensagem => mensagem.trim())
        .filter(Boolean)
        .join(' | ');
    } catch (_error) {
      return '';
    }
  }

  async validarUsuarioAutenticado() {
    await this.loggedInAs.waitFor({
      state: 'visible',
      timeout: 15000
    });

    return (await this.loggedInAs.innerText()).trim();
  }
}

module.exports = { AuthPage };
