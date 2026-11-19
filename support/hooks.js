
const {
  Before,
  After,
  setDefaultTimeout
} = require('@cucumber/cucumber');

const { chromium, firefox, webkit } = require('playwright');

setDefaultTimeout(30000);

// ==================================================
// CONFIGURAÇÃO DOS NAVEGADORES
// ==================================================

const BROWSERS = {
  chromium,
  firefox,
  webkit
};

function obterNavegador() {
  const nome = (process.env.BROWSER || 'chromium').toLowerCase();
  const navegador = BROWSERS[nome];

  if (!navegador) {
    throw new Error(
      `[HOOK] Navegador inválido: "${nome}". ` +
      'Utilize chromium, firefox ou webkit.'
    );
  }

  return { nome, navegador };
}

// ==================================================
// IDENTIFICAÇÃO DOS CENÁRIOS WEB
// ==================================================

function isWebScenario(pickle) {
  const featurePath = (pickle.uri || '').replace(/\\/g, '/');

  return /features\/WEB\//i.test(featurePath);
}

// ==================================================
// INICIALIZAÇÃO DO NAVEGADOR
// SOMENTE PARA CENÁRIOS WEB
// ==================================================

Before(async function ({ pickle }) {
  this.isWebScenario = isWebScenario(pickle);

  if (!this.isWebScenario) {
    console.log('[HOOK] Cenário API: navegador não será iniciado');
    return;
  }

  try {
    const { nome, navegador } = obterNavegador();

    this.browser = await navegador.launch({
      headless: true
    });

    this.context = await this.browser.newContext();

    this.page = await this.context.newPage();

    console.log(`[HOOK] Navegador iniciado: ${nome}`);

  } catch (error) {
    console.error(
      '[HOOK] Erro ao iniciar navegador:',
      error.message
    );

    if (this.context) {
      await this.context.close().catch(() => {});
    }

    if (this.browser) {
      await this.browser.close().catch(() => {});
    }

    throw error;
  }
});

// ==================================================
// FINALIZAÇÃO E EVIDÊNCIAS
// ==================================================

After(async function (scenario) {
  try {
    if (
      this.isWebScenario &&
      scenario.result?.status === 'FAILED' &&
      this.page &&
      !this.page.isClosed()
    ) {
      const screenshot = await this.page.screenshot({
        fullPage: true,
        timeout: 10000
      });

      await this.attach(screenshot, 'image/png');
    }

  } catch (error) {
    console.error(
      '[HOOK] Erro ao capturar screenshot:',
      error.message
    );

  } finally {
    if (this.context) {
      try {
        await this.context.close();
      } catch (error) {
        console.error(
          '[HOOK] Erro ao fechar contexto:',
          error.message
        );
      }
    }

    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error(
          '[HOOK] Erro ao encerrar navegador:',
          error.message
        );
      }
    }

    if (this.isWebScenario) {
      console.log('[HOOK] Navegador encerrado');
    }
  }
});
