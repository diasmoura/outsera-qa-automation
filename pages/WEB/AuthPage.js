
class AuthPage {
  constructor(page) {
    this.page = page;

    // Título da página de login
    this.loginHeading = page.getByRole('heading', {
      name: /login to your account/i
    });

    // Formulário de autenticação
    this.loginForm = page.locator('form[action="/login"]');

    // Campos de autenticação
    this.emailInput = this.loginForm.locator(
      'input[data-qa="login-email"]'
    );

    this.passwordInput = this.loginForm.locator(
      'input[data-qa="login-password"]'
    );

    // Botão de login
    this.loginButton = this.loginForm.locator(
      'button[data-qa="login-button"]'
    );

    // Mensagem de erro
    this.errorMessage = this.loginForm.locator('p');

    // Usuário autenticado
    this.loggedInAs = page.getByText(/logged in as/i);
  }

  // Acessar página de login
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
  }

  // Realizar login
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // Preencher e-mail
  async preencherEmail(email) {
    await this.emailInput.fill(email);
  }

  // Preencher senha
  async preencherSenha(password) {
    await this.passwordInput.fill(password);
  }

  // Clicar no botão de login
  async clicarLogin() {
    await this.loginButton.click();
  }

  // Verificar visibilidade da página
  async isLoginVisible() {
    return this.loginHeading.isVisible();
  }

  // Capturar mensagem de erro
  async getErrorMessage() {
    const mensagem = this.errorMessage.first();

    await mensagem.waitFor({
      state: 'visible',
      timeout: 10000
    }).catch(() => {});

    if (!(await mensagem.isVisible().catch(() => false))) {
      return '';
    }

    return (await mensagem.innerText()).trim();
  }

  // Validar usuário autenticado
  async validarUsuarioAutenticado() {
    await this.loggedInAs.waitFor({
      state: 'visible',
      timeout: 15000
    });

    return (await this.loggedInAs.innerText()).trim();
  }
}

module.exports = { AuthPage };
