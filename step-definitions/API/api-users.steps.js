
const {
  When,
  Then,
  After
} = require('@cucumber/cucumber');

const { request, expect } = require('@playwright/test');

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
  apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Accept: 'application/json'
    }
  });
}

async function lerResposta() {
  responseText = await response.text();

  try {
    responseBody = JSON.parse(responseText);
  } catch {
    responseBody = null;
  }
}

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
      `[API] POST com JSON malformado retornou status ${response.status()}`
    );

    console.log(`[API] Resposta: ${responseText}`);
  }
);

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

When(
  'enviar uma requisição DELETE para o usuário de ID {int}',
  async function (id) {
    await criarContextoAPI();

    response = await apiContext.delete(`/users/${id}`);

    await lerResposta();
  }
);

When(
  'enviar uma requisição TRACE para a rota de usuários',
  async function () {
    await criarContextoAPI();

    response = await apiContext.fetch('/users', {
      method: 'TRACE'
    });

    await lerResposta();
  }
);

Then(
  'a resposta CRUD da API deve ter status {int}',
  function (statusEsperado) {
    expect(response.status()).toBe(statusEsperado);
  }
);

Then(
  'o header Content-Type deve indicar JSON',
  function () {
    expect(response.headers()['content-type'])
      .toContain('application/json');
  }
);

Then(
  'o nome do usuário retornado deve ser {string}',
  function (nomeEsperado) {
    expect(responseBody).not.toBeNull();
    expect(responseBody.name).toBe(nomeEsperado);
  }
);

Then(
  'a resposta CRUD deve conter um ID de usuário',
  function () {
    expect(responseBody).not.toBeNull();
    expect(responseBody).toHaveProperty('id');
    expect(responseBody.id).toBeTruthy();
  }
);

Then(
  'a resposta CRUD deve conter o ID de usuário {int}',
  function (idEsperado) {
    expect(responseBody).not.toBeNull();
    expect(responseBody.id).toBe(idEsperado);
  }
);

Then(
  'a resposta deve demonstrar que a API aceita dados incompletos',
  function () {
    expect(responseBody).not.toBeNull();
    expect(typeof responseBody).toBe('object');

    // JSONPlaceholder pode aceitar dados incompletos.
    // Este teste documenta o comportamento observado.
    expect(responseBody).not.toHaveProperty('name');
  }
);

Then(
  'a resposta CRUD da API deve indicar que a requisição foi processada ou rejeitada',
  function () {
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  }
);

Then(
  'a resposta da requisição malformada deve ser registrada',
  function () {
    expect(typeof responseText).toBe('string');

    console.log(
      `[API] Resultado registrado: HTTP ${response.status()}`
    );
  }
);

Then(
  'a resposta de exclusão deve ser um objeto JSON',
  function () {
    expect(responseBody).not.toBeNull();
    expect(typeof responseBody).toBe('object');
    expect(Array.isArray(responseBody)).toBe(false);
  }
);

Then(
  'a resposta CRUD da API deve indicar que o método não é permitido',
  function () {
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(600);
  }
);

After(async function () {
  if (apiContext) {
    await apiContext.dispose();
    apiContext = undefined;
  }

  response = undefined;
  responseBody = undefined;
  responseText = undefined;
});
