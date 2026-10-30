
require('dotenv').config();

const { Given, When, Then } = require('@cucumber/cucumber');
const { AuthPage } = require('../../pages/WEB/AuthPage');

const TIMEOUT = 15000;

// ==================================================
// INICIALIZAÇÃO
// ==================================================

const inicializarAuthPage = function () {
  if (!this.page) {
    throw new Error(
      '[LOGIN] Página do Playwright não inicializada. Verifique os hooks.'
    );
  }

  if (!this.authPage) {
    this.authPage = new AuthPage(this.page);
  }
};

// ==================================================
// VALIDAÇÃO DE CREDENCIAIS
// ==================================================

const validarCredenciais = () => {
  const email = process.env.QA_LOGIN_EMAIL;
  const senha = process.env.QA_LOGIN_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      '[CONFIGURAÇÃO] Configure QA_LOGIN_EMAIL e QA_LOGIN_PASSWORD no arquivo .env.'
    );
  }

  return { email, senha };
};

// ==================================================
// VALIDAÇÃO DE E-MAIL
// ==================================================

const validarEmailCadastrado = () => {
  const email = process.env.QA_LOGIN_EMAIL;

  if (!email) {
    throw new Error(
      '[CONFIGURAÇÃO] Configure QA_LOGIN_EMAIL no arquivo .env.'
    );
  }

  return email;
};

// ==================================================
// ACESSO À PÁGINA DE LOGIN
// ==================================================

Given('que acesso a página de login', async function () {
  inicializarAuthPage.call(this);

  await this.authPage.acessarPagina();

  console.log('[LOGIN] Página de login acessada com sucesso.');
});

// ==================================================
// LOGIN POSITIVO
// ==================================================

When('realizo login com credenciais cadastradas', async function () {
  inicializarAuthPage.call(this);

  const { email, senha } = validarCredenciais();

  await this.authPage.login(email, senha);

  console.log('[LOGIN] Credenciais cadastradas informadas.');
});

// ==================================================
// LOGIN NEGATIVO - E-MAIL CADASTRADO
// ==================================================

When('informo um e-mail cadastrado', async function () {
  inicializarAuthPage.call(this);

  const email = validarEmailCadastrado();

  await this.authPage.emailInput.fill(email);

  console.log('[LOGIN] E-mail cadastrado informado.');
});

// ==================================================
// LOGIN NEGATIVO - SENHA INCORRETA
// ==================================================

When('informo uma senha incorreta', async function () {
  inicializarAuthPage.call(this);

  await this.authPage.passwordInput.fill('SenhaIncorreta123!');

  console.log('[LOGIN] Senha incorreta informada.');
});

// ==================================================
// LOGIN NEGATIVO - SENHA QUALQUER
// ==================================================

When('informo uma senha qualquer', async function () {
  inicializarAuthPage.call(this);

  await this.authPage.passwordInput.fill('SenhaQualquer123!');

  console.log('[LOGIN] Senha inválida informada.');
});

// ==================================================
// LOGIN NEGATIVO - E-MAIL NÃO CADASTRADO
// ==================================================

When('informo um e-mail não cadastrado', async function () {
  inicializarAuthPage.call(this);

  const emailInexistente =
    `qa-inexistente-${Date.now()}@example.com`;

  await this.authPage.emailInput.fill(emailInexistente);

  console.log('[LOGIN] E-mail não cadastrado informado.');
});

// ==================================================
// SUBMISSÃO DO LOGIN
// ==================================================

When('solicito o login', async function () {
  inicializarAuthPage.call(this);

  await this.authPage.clicarLogin();

  console.log('[LOGIN] Solicitação de autenticação enviada.');
});

// ==================================================
// CAMPOS OBRIGATÓRIOS EM BRANCO
// ==================================================

When('deixo o e-mail e a senha em branco', async function () {
  inicializarAuthPage.call(this);

  await this.authPage.emailInput.fill('');
  await this.authPage.passwordInput.fill('');

  console.log('[LOGIN] Campos de e-mail e senha deixados em branco.');
});

// ==================================================
// VALIDAÇÃO DE LOGIN COM SUCESSO
// ==================================================

Then('devo acessar minha conta com sucesso', async function () {
  inicializarAuthPage.call(this);

  const texto = await this.authPage.validarUsuarioAutenticado();

  if (!texto) {
    throw new Error(
      '[LOGIN] A autenticação não foi confirmada na página.'
    );
  }

  console.log(`[LOGIN] Autenticação realizada com sucesso: ${texto}`);
});

// ==================================================
// VALIDAÇÃO DE MENSAGEM DE ERRO
// ==================================================

const validarMensagemErroLogin = async function (tipoMensagem) {
  inicializarAuthPage.call(this);

  const mensagem = await this.authPage.getErrorMessage();

  if (!mensagem || !mensagem.trim()) {
    throw new Error(
      `[LOGIN] Nenhuma mensagem de erro foi exibida para o cenário: ${tipoMensagem}.`
    );
  }

  const mensagemNormalizada = mensagem.trim();

  const erroIdentificado =
    /incorrect|invalid|incorreto|incorreta|inválido|inválida/i
      .test(mensagemNormalizada);

  if (!erroIdentificado) {
    throw new Error(
      `[LOGIN] Mensagem inesperada para ${tipoMensagem}. ` +
      `Mensagem recebida: "${mensagemNormalizada}".`
    );
  }

  console.log(
    `[LOGIN] Mensagem de erro validada (${tipoMensagem}): ${mensagemNormalizada}`
  );

  return mensagemNormalizada;
};

// ==================================================
// LOGIN NEGATIVO - SENHA INCORRETA
// ==================================================

Then(
  'devo visualizar uma mensagem de erro de autenticação',
  async function () {
    await validarMensagemErroLogin.call(this, 'senha incorreta');
  }
);

// ==================================================
// LOGIN NEGATIVO - USUÁRIO NÃO ENCONTRADO
// ==================================================

Then(
  'devo visualizar uma mensagem de usuário não encontrado',
  async function () {
    await validarMensagemErroLogin.call(this, 'e-mail não cadastrado');
  }
);

// ==================================================
// VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS
// ==================================================

Then(
  'devo visualizar as validações dos campos obrigatórios',
  async function () {
    inicializarAuthPage.call(this);

    const email = await this.authPage.emailInput.evaluate(element => ({
      required: element.required,
      valueMissing: element.validity.valueMissing,
      value: element.value
    }));

    const senha = await this.authPage.passwordInput.evaluate(element => ({
      required: element.required,
      valueMissing: element.validity.valueMissing,
      value: element.value
    }));

    if (!email.required || !senha.required) {
      throw new Error(
        '[LOGIN] Os campos de e-mail e senha precisam estar configurados como obrigatórios.'
      );
    }

    if (email.value || senha.value) {
      throw new Error(
        '[LOGIN] Os campos deveriam estar vazios para esta validação.'
      );
    }

    if (!email.valueMissing || !senha.valueMissing) {
      throw new Error(
        '[LOGIN] O navegador não identificou os campos obrigatórios vazios.'
      );
    }

    const formularioInvalido = await this.authPage.loginButton.evaluate(
      button => button.form ? !button.form.checkValidity() : false
    );

    if (!formularioInvalido) {
      throw new Error(
        '[LOGIN] O formulário não identificou os campos obrigatórios em branco.'
      );
    }

    console.log(
      '[LOGIN] Validação de obrigatoriedade dos campos realizada com sucesso.'
    );
  }
);
