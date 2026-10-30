
const {
  Before,
  After,
  setDefaultTimeout,
  Status
} = require('@cucumber/cucumber');

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

setDefaultTimeout(30000);

Before(async function () {
  this.browser = await chromium.launch({ headless: true });

  this.context = await this.browser.newContext({
    viewport: { width: 1366, height: 768 }
  });

  // Bloqueia requisições de anúncios para reduzir interferências.
  await this.context.route(
    /googleads|doubleclick|googlesyndication|pagead/,
    route => route.abort()
  );

  this.page = await this.context.newPage();
});

After(async function (scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const evidenceDir = path.resolve(__dirname, '../reports/evidences');

    fs.mkdirSync(evidenceDir, { recursive: true });

    const scenarioName = scenario.pickle.name
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    const screenshotPath = path.join(
      evidenceDir,
      `${scenarioName}-${Date.now()}.png`
    );

    try {
      const screenshot = await this.page.screenshot({
        fullPage: true
      });

      fs.writeFileSync(screenshotPath, screenshot);
      this.attach(screenshot, 'image/png');

      console.log(`Screenshot salvo em: ${screenshotPath}`);
    } catch (error) {
      console.error(
        'Não foi possível salvar a screenshot:',
        error.message
      );
    }
  }

  if (this.context) {
    await this.context.close();
  }

  if (this.browser) {
    await this.browser.close();
  }
});
