
const { When, Then, After } = require('@cucumber/cucumber');
const { request, expect } = require('@playwright/test');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

let apiContext;
let response;
let responseBody;

const usuario = {
  name: 'Lucas QA',
  username: 'lucasqa',
  email: 'lucas.qa@example.com'
};

When(
  'enviar uma requisição POST para criar um usuário',
  async function () {
    apiContext = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json'
      }
    });

    response = await apiContext.post('/users', {
      data: usuario
    });

    responseBody = await response.json();
  }
);

When(
  'enviar uma requisição PUT para atualizar o usuário de ID {int}',
  async function (id) {
    apiContext = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json'
      }
    });

    response = await apiContext.put(`/users/${id}`, {
      data: {
        ...usuario,
        id,
        name: 'Lucas QA Atualizado'
      }
    });

    responseBody = await response.json();
  }
);

When(
  'enviar uma requisição DELETE para o usuário de ID {int}',
  async function (id) {
    apiContext = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json'
      }
    });

    response = await apiContext.delete(`/users/${id}`);
  }
);

Then(
  'o nome do usuário retornado deve ser {string}',
  function (nomeEsperado) {
    expect(responseBody.name).toBe(nomeEsperado);
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
  'a resposta CRUD da API deve ter status {int}',
  function (statusEsperado) {
    expect(response.status()).toBe(statusEsperado);
  }
);

After(async function () {
  if (apiContext) {
    await apiContext.dispose();
    apiContext = undefined;
  }
});
