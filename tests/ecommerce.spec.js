
const { test, expect } = require('@playwright/test');

const baseURL = 'https://automationexercise.com';

test.describe('Testes Web - E-commerce', () => {

  test('HOME - Deve carregar a página inicial', async ({ page }) => {
    const response = await page.goto(baseURL, {
      waitUntil: 'domcontentloaded'
    });

    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);

    await expect(page).toHaveTitle(/automation exercise/i);

    await expect(
      page.locator('a[href="/login"]').first()
    ).toBeVisible();
  });

  test('PRODUTOS - Deve acessar e exibir a lista de produtos', async ({ page }) => {
    const response = await page.goto(`${baseURL}/products`, {
      waitUntil: 'domcontentloaded'
    });

    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);

    const listaProdutos = page.locator('.features_items');

    await expect(listaProdutos).toBeVisible({
      timeout: 15000
    });

    const produtos = page.locator(
      '.features_items .product-image-wrapper'
    );

    await expect(produtos.first()).toBeVisible({
      timeout: 15000
    });

    expect(await produtos.count()).toBeGreaterThan(0);
  });

  test('LOGIN - Deve exibir os campos de autenticação', async ({ page }) => {
    const response = await page.goto(`${baseURL}/login`, {
      waitUntil: 'domcontentloaded'
    });

    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);

    const formularioLogin = page.locator('form[action="/login"]');

    await expect(formularioLogin).toBeVisible();

    await expect(
      formularioLogin.locator('input[data-qa="login-email"]')
    ).toBeVisible();

    await expect(
      formularioLogin.locator('input[data-qa="login-password"]')
    ).toBeVisible();

    await expect(
      formularioLogin.locator('button[data-qa="login-button"]')
    ).toBeVisible();
  });

});
