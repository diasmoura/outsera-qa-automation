
const {
  When,
  Then,
  After
} = require('@cucumber/cucumber');

const { request, expect } = require('@playwright/test');

const {
  validarStatus,
  validarContentTypeJson,
  validarJsonObjeto
} = require('../../helpers/apiAssertions');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

let apiContext;
let response;
let responseBody;
let responseText;

const usuario = {
  name: 'Lucas QA',
  username: 'lucasqa',
  email: 'lucas.qa@example.com'
};

async function criarContextoAPI() {
  if (apiContext) {
    return;
  }

  apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Accept: 'application/json'
    }
  });
}

async function lerResposta() {
  if (!response) {
    throw new Error('[API] Não existe resposta HTTP para validar.');
  }

  responseText = await response.text();

  if (!responseText || !responseText.trim()) {
    responseBody = null;
    return;
  }

  try {
    responseBody = JSON.parse(responseText);
  } catch {
    responseBody = null;
  }
}

function validarRespostaDisponivel() {
  expect(
    response,
    '[API] A requisição não produziu uma resposta.'
  ).toBeDefined();
}

// ==========================================
// POST - CRIAR USUÁRIO
// ==========================================

When(
  'enviar uma requisição POST para criar um usuário',
  async function () {
    await criarContextoAPI();

    response = await apiContext.post('/users', {
      data: usuario
    });

    await lerResposta();
  }
);

When(
  'enviar uma requisição POST sem os campos do usuário',
  async function () {
    await criarContextoAPI();

    response = await apiContext.post('/users', {
      data: {}
    });

    await lerResposta();
  }
);

When(
  'enviar uma requisição POST com JSON malformado',
  async function () {
    await criarContextoAPI();

    response = await apiContext.post('/users', {
      data: '{"name":',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    await lerResposta();

    console.log(
      `[API] POST malformado - HTTP ${response.status()}`
    );

    console.log(
      `[API] Corpo da resposta: ${responseText}`
    );
  }
);

// ==========================================
// PUT - ATUALIZAR USUÁRIO
// ==========================================

When(
  'enviar uma requisição PUT para atualizar o usuário de ID {int}',
  async function (id) {
    await criarContextoAPI();

    response = await apiContext.put(`/users/${id}`, {
      data: {
        ...usuario,
        id,
        name: 'Lucas QA Atualizado'
      }
    });

    await lerResposta();
  }
);

When(
  'enviar uma requisição PUT sem os campos do usuário para o ID {int}',
  async function (id) {
    await criarContextoAPI();

    response = await apiContext.put(`/users/${id}`, {
      data: {}
    });

    await lerResposta();
  }
);

// ==========================================
// DELETE - EXCLUIR USUÁRIO
// ==========================================

When(
  'enviar uma requisição DELETE para o usuário de ID {int}',
  async function (id) {
    await criarContextoAPI();

    response = await apiContext.delete(`/users/${id}`);

    await lerResposta();
  }
);

// ==========================================
// VALIDAÇÕES HTTP
// ==========================================

Then(
  'a resposta CRUD da API deve ter status {int}',
  function (statusEsperado) {
    validarStatus(response, statusEsperado, 'API CRUD');
  }
);

Then(
  'o header Content-Type deve indicar JSON',
  function () {
    validarContentTypeJson(response, 'API CRUD');
  }
);

// ==========================================
// VALIDAÇÕES DO JSON
// ==========================================

Then(
  'o nome do usuário retornado deve ser {string}',
  function (nomeEsperado) {
    validarJsonObjeto(responseBody, 'API CRUD');

    expect(responseBody).toHaveProperty('name');
    expect(responseBody.name).toBe(nomeEsperado);
  }
);

Then(
  'a resposta CRUD deve conter um ID de usuário',
  function () {
    validarJsonObjeto(responseBody, 'API CRUD');

    expect(responseBody).toHaveProperty('id');
    expect(responseBody.id).toBeTruthy();
  }
);

Then(
  'a resposta CRUD deve conter o ID de usuário {int}',
  function (idEsperado) {
    validarJsonObjeto(responseBody, 'API CRUD');

    expect(responseBody.id).toBe(idEsperado);
  }
);

Then(
  'a resposta deve demonstrar que a API aceita dados incompletos',
  function () {
    validarJsonObjeto(responseBody, 'API CRUD');

    expect(responseBody).not.toHaveProperty('name');
  }
);

// ==========================================
// RESPOSTA DE REQUISIÇÃO MALFORMADA
// ==========================================

Then(
  'a resposta da requisição malformada deve ser registrada',
  function () {
    validarRespostaDisponivel();

    validarStatus(response, 500, 'API POST malformado');

    expect(typeof responseText).toBe('string');

    expect(responseText.trim()).not.toBe('');

    console.log(
      `[API] POST malformado validado: HTTP ${response.status()}`
    );
  }
);

// ==========================================
// VALIDAÇÃO DA EXCLUSÃO
// ==========================================

Then(
  'a resposta de exclusão deve ser um objeto JSON',
  function () {
    validarJsonObjeto(responseBody, 'API DELETE');
  }
);

// ==========================================
// ENCERRAMENTO
// ==========================================

After(async function () {
  if (apiContext) {
    await apiContext.dispose();
  }

  apiContext = undefined;
  response = undefined;
  responseBody = undefined;
  responseText = undefined;
});

// ==========================================
// TRACE - MÉTODO HTTP NÃO PERMITIDO
// ==========================================

When(
  'enviar uma requisição TRACE para a rota de usuários',
  async function () {
    await criarContextoAPI();

    response = await apiContext.fetch('/users', {
      method: 'TRACE'
    });

    await lerResposta();

    console.log(
      `[API TRACE] Status recebido: ${response.status()}`
    );

    console.log(
      `[API TRACE] Content-Type: ${response.headers()['content-type']}`
    );
  }
);

Then(
  'o header Content-Type da resposta deve indicar HTML',
  function () {
    validarRespostaDisponivel();

    const contentType =
      response.headers()['content-type'] || '';

    expect(contentType).toMatch(/^text\/html(?:\s*;|$)/i);
  }
);

Then(
  'a resposta CRUD da API deve ter o status HTTP esperado para método não permitido',
  function () {
    validarStatus(response, 405, 'API TRACE');
  }
);
