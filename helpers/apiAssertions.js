
const { expect } = require('@playwright/test');

function validarStatus(response, statusEsperado, contexto = 'API') {
  expect(
    response,
    `[${contexto}] A requisição não retornou uma resposta HTTP.`
  ).toBeDefined();

  const statusRecebido = response.status();

  expect(
    statusRecebido,
    `[${contexto}] Status HTTP inesperado. Esperado: ${statusEsperado}; recebido: ${statusRecebido}.`
  ).toBe(statusEsperado);
}

function validarContentTypeJson(response, contexto = 'API') {
  expect(
    response,
    `[${contexto}] Não existe resposta HTTP para validar o Content-Type.`
  ).toBeDefined();

  const contentType = response.headers()['content-type'] || '';

  expect(
    contentType,
    `[${contexto}] O Content-Type não indica JSON. Recebido: ${contentType}.`
  ).toMatch(/^application\/json(?:\s*;|$)/i);
}

function validarJsonObjeto(body, contexto = 'API') {
  expect(
    body,
    `[${contexto}] A resposta não contém um objeto JSON válido.`
  ).not.toBeNull();

  expect(
    typeof body,
    `[${contexto}] A resposta JSON não é um objeto.`
  ).toBe('object');

  expect(
    Array.isArray(body),
    `[${contexto}] A resposta retornou um array em vez de um objeto.`
  ).toBe(false);
}

module.exports = {
  validarStatus,
  validarContentTypeJson,
  validarJsonObjeto
};
