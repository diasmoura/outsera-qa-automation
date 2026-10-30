
const { test, expect } = require('@playwright/test');

const baseURL = 'https://jsonplaceholder.typicode.com';

test.describe('Testes de API - Usuários', () => {
  test('GET - Deve consultar um usuário com sucesso', async ({ request }) => {
    const response = await request.get(`${baseURL}/users/1`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    expect(body.id).toBe(1);
    expect(body.name).toBeTruthy();
    expect(body.email).toBeTruthy();
  });

  test('GET - Deve retornar usuário inexistente', async ({ request }) => {
    const response = await request.get(`${baseURL}/users/9999`);

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({});
  });

  test('POST - Deve simular a criação de um usuário', async ({ request }) => {
    const response = await request.post(`${baseURL}/users`, {
      data: {
        name: 'QA Outsera',
        username: 'qaoutsera',
        email: 'qa@outsera.com'
      }
    });

    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    expect(body.id).toBeTruthy();
    expect(body.name).toBe('QA Outsera');
    expect(body.username).toBe('qaoutsera');
    expect(body.email).toBe('qa@outsera.com');
  });

  test('POST - Deve avaliar requisição sem campos obrigatórios', async ({ request }) => {
  const response = await request.post(`${baseURL}/users`, {
    data: {}
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  // JSONPlaceholder simula a criação e retorna um ID.
  expect(body.id).toBeTruthy();
  expect(body).not.toHaveProperty('name');
  expect(body).not.toHaveProperty('email');
});

  test('POST - Deve avaliar payload malformado', async ({ request }) => {
  const response = await request.post(`${baseURL}/users`, {
    data: '{ nome: QA, email: inválido }',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Registra os status observados/esperados para essa API de demonstração.
  expect([201, 400, 415, 422, 500]).toContain(response.status());
});

  test('PUT - Deve simular a atualização de um usuário', async ({ request }) => {
    const response = await request.put(`${baseURL}/users/1`, {
      data: {
        id: 1,
        name: 'QA Atualizado',
        username: 'qaoutsera',
        email: 'qa@outsera.com'
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.id).toBe(1);
    expect(body.name).toBe('QA Atualizado');
    expect(body.email).toBe('qa@outsera.com');
  });

  test('DELETE - Deve simular a exclusão de um usuário', async ({ request }) => {
    const response = await request.delete(`${baseURL}/users/1`);

    expect(response.status()).toBe(200);
  });

  test('Método inválido - Deve retornar status de erro', async ({ request }) => {
    const response = await request.fetch(`${baseURL}/users/1`, {
      method: 'INVALID'
    });

    expect([400, 404, 405, 501]).toContain(response.status());
  });
});
