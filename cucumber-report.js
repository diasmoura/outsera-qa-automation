
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');
const CONSOLIDATED_DIR = path.join(REPORTS_DIR, 'consolidated');
const HTML_DIR = path.join(REPORTS_DIR, 'html');

const REPORT_SOURCES = [
  {
    name: 'web-chromium',
    label: 'Web - Chromium',
    candidates: [
      path.join(REPORTS_DIR, 'web', 'chromium-report.json'),
      path.join(REPORTS_DIR, 'web', 'cucumber-web-report.json'),
      path.join(REPORTS_DIR, 'cucumber-web-report.json')
    ]
  },
  {
    name: 'web-firefox',
    label: 'Web - Firefox',
    candidates: [
      path.join(REPORTS_DIR, 'web', 'firefox-report.json')
    ]
  },
  {
    name: 'web-webkit',
    label: 'Web - WebKit',
    candidates: [
      path.join(REPORTS_DIR, 'web', 'webkit-report.json')
    ]
  },
  {
    name: 'api',
    label: 'API',
    candidates: [
      path.join(REPORTS_DIR, 'api', 'cucumber-api-report.json')
    ]
  }
];

/**
 * Localiza o primeiro relatório existente para uma fonte.
 */
function localizarRelatorio(source) {
  return source.candidates.find(file => fs.existsSync(file));
}

/**
 * Carrega e valida um relatório JSON do Cucumber.
 */
function carregarRelatorio(source, file) {
  let json;

  try {
    json = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(
      `[REPORT] JSON inválido em ${file}. ${error.message}`,
      { cause: error }
    );
  }

  if (!Array.isArray(json) || json.length === 0) {
    throw new Error(
      `[REPORT] Estrutura vazia ou inválida: ${file}`
    );
  }

  const scenarios = json.flatMap(feature =>
    (feature.elements || []).filter(
      element => element.type === 'scenario'
    )
  );

  if (scenarios.length === 0) {
    throw new Error(
      `[REPORT] Nenhum cenário encontrado em ${file}`
    );
  }

  const summary = {
    scenarios: scenarios.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    steps: 0,
    passedSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    otherSteps: 0
  };

  for (const scenario of scenarios) {
    const steps = scenario.steps || [];

    let scenarioFailed = false;

    for (const step of steps) {
      summary.steps++;

      const status = step.result?.status;

      if (status === 'passed') {
        summary.passedSteps++;
      } else if (status === 'failed') {
        summary.failedSteps++;
        scenarioFailed = true;
      } else if (status === 'skipped') {
        summary.skippedSteps++;
      } else {
        summary.otherSteps++;
        scenarioFailed = true;
      }
    }

    if (scenarioFailed) {
      summary.failed++;
    } else if (
      steps.length > 0 &&
      steps.every(step => step.result?.status === 'passed')
    ) {
      summary.passed++;
    } else {
      summary.skipped++;
    }
  }

  return {
    name: source.name,
    label: source.label,
    file,
    json,
    summary
  };
}

/**
 * Prepara e valida todas as fontes antes de alterar os relatórios.
 */
function prepararFontes() {
  const selected = [];

  for (const source of REPORT_SOURCES) {
    const file = localizarRelatorio(source);

    if (!file) {
      console.warn(
        `[REPORT] Fonte não encontrada: ${source.label}`
      );
      continue;
    }

    selected.push(
      carregarRelatorio(source, file)
    );
  }

  if (selected.length === 0) {
    throw new Error(
      'Nenhum JSON válido do Cucumber foi encontrado.'
    );
  }

  const hasWeb = selected.some(item =>
    item.name.startsWith('web-')
  );

  const hasApi = selected.some(item =>
    item.name === 'api'
  );

  if (!hasWeb || !hasApi) {
    throw new Error(
      '[REPORT] Não foi possível localizar pelo menos uma fonte Web e uma fonte API.'
    );
  }

  return selected;
}

/**
 * Gera os JSONs consolidados com nomes exclusivos.
 */
function gerarJsonsConsolidados(selected) {
  fs.mkdirSync(CONSOLIDATED_DIR, {
    recursive: true
  });

  for (const item of selected) {
    const destination = path.join(
      CONSOLIDATED_DIR,
      `${item.name}-cucumber-report.json`
    );

    fs.writeFileSync(
      destination,
      JSON.stringify(item.json, null, 2),
      'utf8'
    );

    console.log(
      `[REPORT] ${item.label}: ${item.summary.scenarios} cenários`
    );
  }
}

/**
 * Exibe um resumo das fontes processadas.
 */
function exibirResumo(selected) {
  const total = selected.reduce(
    (acc, item) => {
      acc.scenarios += item.summary.scenarios;
      acc.passed += item.summary.passed;
      acc.failed += item.summary.failed;
      acc.skipped += item.summary.skipped;
      acc.steps += item.summary.steps;
      acc.passedSteps += item.summary.passedSteps;
      acc.failedSteps += item.summary.failedSteps;
      acc.skippedSteps += item.summary.skippedSteps;
      acc.otherSteps += item.summary.otherSteps;

      return acc;
    },
    {
      scenarios: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      steps: 0,
      passedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
      otherSteps: 0
    }
  );

  console.log('\n========== RESUMO CONSOLIDADO ==========');

  for (const item of selected) {
    const s = item.summary;

    console.log(
      `${item.label}: ` +
      `${s.scenarios} cenários | ` +
      `${s.passed} aprovados | ` +
      `${s.failed} falhos | ` +
      `${s.skipped} ignorados`
    );
  }

  console.log('----------------------------------------');
  console.log(`Fontes processadas: ${selected.length}`);
  console.log(`Cenários: ${total.scenarios}`);
  console.log(`Aprovados: ${total.passed}`);
  console.log(`Falhos: ${total.failed}`);
  console.log(`Ignorados: ${total.skipped}`);
  console.log(`Steps: ${total.steps}`);
  console.log(`Steps aprovados: ${total.passedSteps}`);
  console.log(`Steps falhos: ${total.failedSteps}`);
  console.log(`Steps ignorados: ${total.skippedSteps}`);
  console.log(`Steps com outros status: ${total.otherSteps}`);
  console.log('========================================\n');

  if (
    total.failed > 0 ||
    total.failedSteps > 0 ||
    total.otherSteps > 0
  ) {
    console.warn(
      '[REPORT] ATENÇÃO: existem falhas ou steps com status não aprovado.'
    );
  }

  return total;
}

/**
 * Gera o relatório HTML consolidado.
 */
async function gerarHtml() {
  const module = await import('multiple-cucumber-html-reporter');
  const reporter = module.default || module;

  fs.mkdirSync(HTML_DIR, {
    recursive: true
  });

  await reporter.generate({
    jsonDir: CONSOLIDATED_DIR,
    reportPath: HTML_DIR,
    openReportInBrowser: false,
    disableLog: true,
    pageTitle: 'Outsera QA Automation',
    reportName: 'Relatório Consolidado - Web Cross-Browser e API',
    displayDuration: true,
    metadata: {
      browser: {
        name: 'Chromium, Firefox e WebKit',
        version: 'Playwright'
      },
      device: 'Automação',
      platform: {
        name: process.platform
      }
    }
  });
}

/**
 * Fluxo principal.
 */
async function generateReport() {
  try {
    console.log('[REPORT] Iniciando relatório consolidado...');

    // Primeiro valida todas as fontes.
    const selected = prepararFontes();

    // Só depois remove os arquivos consolidados anteriores.
    fs.rmSync(CONSOLIDATED_DIR, {
      recursive: true,
      force: true
    });

    fs.rmSync(HTML_DIR, {
      recursive: true,
      force: true
    });

    // Gera os novos arquivos.
    gerarJsonsConsolidados(selected);

    const total = exibirResumo(selected);

    // Gera o HTML.
    await gerarHtml();

    console.log('[REPORT] Relatório HTML gerado com sucesso!');
    console.log(`[REPORT] Fontes processadas: ${selected.length}`);
    console.log(`[REPORT] Cenários registrados: ${total.scenarios}`);
    console.log(`[REPORT] Steps registrados: ${total.steps}`);
    console.log(`[REPORT] Local: ${HTML_DIR}`);

  } catch (error) {
    console.error(
      '[REPORT] Falha ao gerar relatório:',
      error
    );

    process.exitCode = 1;
  }
}

generateReport();
