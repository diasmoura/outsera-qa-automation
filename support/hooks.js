
const {
  Before,
  After,
  setDefaultTimeout
} = require('@cucumber/cucumber');

const { chromium } = require('playwright');

setDefaultTimeout(30000);

// ==================================================
// IDENTIFICAÇÃO DOS CENÁRIOS WEB
// ==================================================

function isWebScenario(pickle) {
  const featurePath = (pickle.uri || '').replace(/\\/g, '/');

  return /features\/WEB\//i.test(featurePath);
}

// ==================================================
// INICIALIZAÇÃO DO NAVEGADOR
// Somente para cenários WEB
// ==================================================

Before(async function ({ pickle }) {
  this.isWebScenario = isWebScenario(pickle);

  if (!this.isWebScenario) {
    console.log('[HOOK] Cenário API: navegador não será iniciado');
    return;
  }

  this.browser = await chromium.launch({
    headless: true
  });

  this.context = await this.browser.newContext();

  this.page = await this.context.newPage();

  console.log('[HOOK] Navegador iniciado para cenário WEB');
});

// ==================================================
// FINALIZAÇÃO E EVIDÊNCIAS
// ==================================================

After(async function (scenario) {
  try {
    if (
      this.isWebScenario &&
      scenario.result?.status === 'FAILED' &&
      this.page
    ) {
      const screenshot = await this.page.screenshot({
        fullPage: true
      });

      await this.attach(screenshot, 'image/png');

      console.log('[HOOK] Screenshot anexado ao relatório');
    }
  } catch (error) {
    console.error(
      '[HOOK] Erro ao capturar screenshot:',
      error.message
    );
  } finally {
    if (this.context) {
      await this.context.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    if (this.isWebScenario) {
      console.log('[HOOK] Navegador encerrado');
    }
  }
});
