
const {
  When,
  Then,
  After,
  setDefaultTimeout
} = require('@cucumber/cucumber');

const { request, expect } = require('@playwright/test');

setDefaultTimeout(15000);

let apiContext;
let response;
let responseBody;

When('consultar o usuário de ID {int}', async (id) => {
  apiContext = await request.newContext({
    baseURL: 'https://jsonplaceholder.typicode.com',
    extraHTTPHeaders: {
      Accept: 'application/json'
    }
  });

  response = await apiContext.get(`/users/${id}`);
  responseBody = await response.json();
});

Then(
  'a resposta da API deve ter status {int}',
  (statusEsperado) => {
    expect(response.status()).toBe(statusEsperado);
  }
);

Then('o nome do usuário deve estar preenchido', () => {
  expect(responseBody).toHaveProperty('name');
  expect(typeof responseBody.name).toBe('string');
  expect(responseBody.name.trim()).not.toBe('');
});

Then(
  'o header Content-Type da consulta deve indicar JSON',
  function () {
    expect(response.headers()['content-type'])
      .toContain('application/json');
  }
);


After(async () => {
  if (apiContext) {
    await apiContext.dispose();
    apiContext = undefined;
  }
});
