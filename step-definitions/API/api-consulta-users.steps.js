
const {
  When,
  Then,
  After,
  setDefaultTimeout
} = require('@cucumber/cucumber');

const { request, expect } = require('@playwright/test');

const {
  validarStatus,
  validarContentTypeJson
} = require('../../helpers/apiAssertions');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

setDefaultTimeout(15000);

let apiContext;
let response;
let responseBody;

async function criarContextoAPI() {
  apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Accept: 'application/json'
    }
  });
}

async function lerResposta() {
  const responseText = await response.text();

  try {
    responseBody = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    responseBody = null;
  }
}

When(
  'consultar o usuário de ID {int}',
  async function (id) {
    await criarContextoAPI();

    response = await apiContext.get(`/users/${id}`);

    await lerResposta();
  }
);

When(
  'consultar a rota inexistente de usuários',
  async function () {
    await criarContextoAPI();

    response = await apiContext.get('/users-inexistentes');

    await lerResposta();
  }
);

Then(
  'a resposta da API deve ter status {int}',
  function (statusEsperado) {
    validarStatus(response, statusEsperado, 'API Consulta');
  }
);

Then(
  'o header Content-Type da consulta deve indicar JSON',
  function () {
    validarContentTypeJson(response, 'API Consulta');
  }
);

Then(
  'o nome do usuário deve estar preenchido',
  function () {
    expect(
      responseBody,
      '[API Consulta] A resposta não contém um objeto JSON válido.'
    ).not.toBeNull();

    expect(responseBody).toHaveProperty('name');

    expect(typeof responseBody.name).toBe('string');

    expect(responseBody.name.trim()).not.toBe('');
  }
);

Then(
  'a resposta da consulta deve conter os dados obrigatórios do usuário',
  function () {
    expect(responseBody).not.toBeNull();

    expect(responseBody).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        username: expect.any(String),
        email: expect.any(String),
        address: expect.any(Object),
        phone: expect.any(String),
        website: expect.any(String),
        company: expect.any(Object)
      })
    );

    expect(responseBody.address).toHaveProperty('street');
    expect(responseBody.address).toHaveProperty('city');
    expect(responseBody.company).toHaveProperty('name');
  }
);

After(async function () {
  if (apiContext) {
    await apiContext.dispose();
  }

  apiContext = undefined;
  response = undefined;
  responseBody = undefined;
});
