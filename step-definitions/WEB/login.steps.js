
require('dotenv').config();

const { Given, When, Then } = require('@cucumber/cucumber');

const { AuthPage } = require('../../pages/WEB/AuthPage');

// ==================================================
// VALIDAÇÃO DE CREDENCIAIS
// ==================================================

const validarCredenciais = () => {
  const email = process.env.QA_LOGIN_EMAIL;
  const senha = process.env.QA_LOGIN_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      'Configure QA_LOGIN_EMAIL e QA_LOGIN_PASSWORD no arquivo .env.'
    );
  }

  return { email, senha };
};

// ==================================================
// ACESSO À PÁGINA DE LOGIN
// ==================================================

Given('que acesso a página de login', async function () {
  this.authPage = new AuthPage(this.page);

  await this.page.goto('https://automationexercise.com/login');

  await this.authPage.loginHeading.waitFor({
    state: 'visible',
    timeout: 10000
  });
});

// ==================================================
// LOGIN POSITIVO
// ==================================================

When('realizo login com credenciais cadastradas', async function () {
  const { email, senha } = validarCredenciais();

  await this.authPage.login(email, senha);
});

// ==================================================
// LOGIN NEGATIVO - SENHA INCORRETA
// ==================================================

When('informo um e-mail cadastrado', async function () {
  const email = process.env.QA_LOGIN_EMAIL;

  if (!email) {
    throw new Error('Configure QA_LOGIN_EMAIL no arquivo .env.');
  }

  await this.authPage.emailInput.fill(email);
});

When('informo uma senha incorreta', async function () {
  await this.authPage.passwordInput.fill('SenhaIncorreta123!');
});

// ==================================================
// LOGIN NEGATIVO - SENHA QUALQUER
// ==================================================

When('informo uma senha qualquer', async function () {
  await this.authPage.passwordInput.fill('SenhaQualquer123!');
});

// ==================================================
// LOGIN NEGATIVO - E-MAIL NÃO CADASTRADO
// ==================================================

When('informo um e-mail não cadastrado', async function () {
  const emailInexistente =
    `qa-inexistente-${Date.now()}@example.com`;

  await this.authPage.emailInput.fill(emailInexistente);
});

// ==================================================
// SOLICITAR LOGIN
// ==================================================

When('solicito o login', async function () {
  await this.authPage.loginButton.click();
});

// ==================================================
// CAMPOS OBRIGATÓRIOS EM BRANCO
// ==================================================

When('deixo o e-mail e a senha em branco', async function () {
  await this.authPage.emailInput.fill('');
  await this.authPage.passwordInput.fill('');
});

// ==================================================
// VALIDAÇÃO DE LOGIN COM SUCESSO
// ==================================================

Then('devo acessar minha conta com sucesso', async function () {
  const loggedIn = this.page.getByText(/logged in as/i);

  await loggedIn.waitFor({
    state: 'visible',
    timeout: 15000
  });

  console.log('[LOGIN] Autenticação realizada com sucesso.');
});

// ==================================================
// VALIDAÇÃO DE ERRO DE AUTENTICAÇÃO
// ==================================================

Then('devo visualizar uma mensagem de erro de autenticação', async function () {
  const mensagem = await this.authPage.getErrorMessage();

  if (!mensagem) {
    throw new Error(
      'Nenhuma mensagem de erro de autenticação foi exibida.'
    );
  }

  if (!/incorrect|invalid|incorreto|inválid|error/i.test(mensagem)) {
    throw new Error(
      `Mensagem de erro de autenticação não identificada. Recebido: "${mensagem}".`
    );
  }

  console.log(`[LOGIN] Mensagem de autenticação validada: ${mensagem}`);
});

// ==================================================
// VALIDAÇÃO DE USUÁRIO NÃO ENCONTRADO
// ==================================================

Then('devo visualizar uma mensagem de usuário não encontrado', async function () {
  const mensagem = await this.authPage.getErrorMessage();

  if (!mensagem) {
    throw new Error(
      'Nenhuma mensagem de usuário não encontrado foi exibida.'
    );
  }

  if (!/incorrect|invalid|incorreto|inválid|error/i.test(mensagem)) {
    throw new Error(
      `Mensagem de usuário não encontrado não identificada. Recebido: "${mensagem}".`
    );
  }

  console.log(`[LOGIN] Mensagem de usuário não encontrado validada: ${mensagem}`);
});

// ==================================================
// VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS
// ==================================================

Then('devo visualizar as validações dos campos obrigatórios', async function () {
  const emailObrigatorio = await this.authPage.emailInput.evaluate(
    element => element.required
  );

  const senhaObrigatoria = await this.authPage.passwordInput.evaluate(
    element => element.required
  );

  if (!emailObrigatorio || !senhaObrigatoria) {
    throw new Error(
      'Os campos de e-mail e senha não estão configurados como obrigatórios.'
    );
  }

  const formularioInvalido = await this.authPage.loginButton.evaluate(
    button => !button.form.checkValidity()
  );

  if (!formularioInvalido) {
    throw new Error(
      'O formulário não identificou os campos obrigatórios em branco.'
    );
  }

  console.log('[LOGIN] Validação dos campos obrigatórios realizada com sucesso.');
});
