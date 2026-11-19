
const fs = require('fs');
const path = require('path');

const root = __dirname;
const reportsDir = path.join(root, 'reports');
const outputDir = path.join(reportsDir, 'consolidated');
const outputFile = path.join(outputDir, 'index.html');

// --------------------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------------------

function readJson(relativePath) {
  const file = path.join(root, relativePath);

  if (!fs.existsSync(file)) return null;

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(`[DASHBOARD] Erro ao ler ${relativePath}: ${error.message}`);
    return null;
  }
}

function readFirstJson(paths) {
  for (const relativePath of paths) {
    const data = readJson(relativePath);
    if (data !== null) return data;
  }

  return null;
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function formatNumber(value, decimals = 2) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    : 'N/D';
}

function formatInteger(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR')
    : 'N/D';
}

function formatDuration(milliseconds) {
  if (
    typeof milliseconds !== 'number' ||
    !Number.isFinite(milliseconds) ||
    milliseconds < 0
  ) {
    return 'N/D';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min ${seconds} s`;
  }

  if (minutes > 0) {
    return `${minutes} min ${seconds} s`;
  }

  return `${seconds} s`;
}

function statusCard(name, available, href, description = '') {
  return `
    <article class="card">
      <h3>${name}</h3>
      <p class="${available ? 'success' : 'warning'}">
        ${available ? 'Relatório disponível' : 'Não encontrado'}
      </p>
      ${description ? `<p>${description}</p>` : ''}
      ${
        available
          ? `<a href="${href}">Abrir relatório</a>`
          : '<span>Execute ou gere o relatório correspondente.</span>'
      }
    </article>
  `;
}

// --------------------------------------------------
// RELATÓRIOS CUCUMBER
// --------------------------------------------------

const webBrowserReports = [
  { browser: 'Chromium', path: 'reports/web/chromium-report.json' },
  { browser: 'Firefox', path: 'reports/web/firefox-report.json' },
  { browser: 'WebKit', path: 'reports/web/webkit-report.json' }
];

const availableWebReports = webBrowserReports
  .map(item => ({
    ...item,
    data: readJson(item.path)
  }))
  .filter(item => Array.isArray(item.data));

const legacyWebReport = availableWebReports.length === 0
  ? readFirstJson(['reports/cucumber-web-report.json'])
  : null;

const api = readFirstJson([
  'reports/api/cucumber-api-report.json',
  'reports/cucumber-api-report.json'
]);

// --------------------------------------------------
// RELATÓRIOS PLAYWRIGHT E PERFORMANCE
// --------------------------------------------------

const playwright = readJson('test-results/playwright-results.json');
const playwrightLastRun = readJson('test-results/.last-run.json');

const smoke = readJson('reports/performance/smoke-summary.json');
const load = readJson('reports/performance/load-summary.json');

const loadLocal = readJson(
  'reports/performance/load-local-summary.json'
);

// --------------------------------------------------
// CLASSIFICAÇÃO DE STATUS
// --------------------------------------------------

function classifyCucumberScenario(element) {
  const steps = element.steps || [];

  const hasFailure = steps.some(step =>
    ['failed', 'ambiguous', 'undefined'].includes(step.result?.status)
  );

  if (hasFailure) return 'failed';

  const hasSkipped = steps.some(step =>
    ['skipped', 'pending'].includes(step.result?.status)
  );

  if (hasSkipped) return 'skipped';

  return 'passed';
}

function classifyPlaywrightTest(test) {
  if (test.status === 'expected') return 'passed';
  if (test.status === 'unexpected') return 'failed';
  if (test.status === 'flaky') return 'flaky';
  if (test.status === 'skipped') return 'skipped';

  const attempts = test.results || [];

  if (attempts.length === 0) return 'failed';

  const lastAttempt = attempts[attempts.length - 1];

  if (lastAttempt.status === 'passed') {
    return attempts.some(attempt =>
      ['failed', 'timedOut', 'interrupted'].includes(attempt.status)
    ) ? 'flaky' : 'passed';
  }

  if (lastAttempt.status === 'skipped') return 'skipped';

  return 'failed';
}

// --------------------------------------------------
// CONTAGEM CUCUMBER
// --------------------------------------------------

function countCucumberReports(reports) {
  const uniqueScenarios = new Map();

  const result = {
    unique: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    },
    executions: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    },
    steps: 0,
    browsers: {}
  };

  for (const report of reports) {
    const browser = report.browser || 'Execução única';
    const json = report.data;

    if (!Array.isArray(json)) continue;

    const browserResult = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      steps: 0
    };

    for (const feature of json) {
      for (const element of feature.elements || []) {
        if (
          element.type !== 'scenario' &&
          element.type !== 'scenario_outline'
        ) {
          continue;
        }

        const featureUri = feature.uri || feature.id || 'feature';
        const scenarioLine = element.line ?? element.id ?? '';
        const scenarioName = element.name || 'Cenário sem nome';

        const identity = [
          featureUri,
          scenarioLine,
          scenarioName
        ].join('|');

        const status = classifyCucumberScenario(element);
        const steps = element.steps || [];

        result.executions.total++;
        result.executions[status]++;

        browserResult.total++;
        browserResult[status]++;

        result.steps += steps.length;
        browserResult.steps += steps.length;

        if (!uniqueScenarios.has(identity)) {
          uniqueScenarios.set(identity, { statuses: [] });
        }

        uniqueScenarios.get(identity).statuses.push(status);
      }
    }

    result.browsers[browser] = browserResult;
  }

  for (const scenario of uniqueScenarios.values()) {
    result.unique.total++;

    const statuses = scenario.statuses;

    let finalStatus;

    if (statuses.includes('failed')) {
      finalStatus = 'failed';
    } else if (statuses.every(status => status === 'skipped')) {
      finalStatus = 'skipped';
    } else {
      finalStatus = 'passed';
    }

    result.unique[finalStatus]++;
  }

  return result;
}

const webReports = availableWebReports.length > 0
  ? availableWebReports.map(item => ({
      browser: item.browser,
      data: item.data
    }))
  : legacyWebReport
    ? [{ browser: 'Relatório legado', data: legacyWebReport }]
    : [];

const webCount = countCucumberReports(webReports);

const apiCount = countCucumberReports(
  Array.isArray(api)
    ? [{ browser: 'Execução única', data: api }]
    : []
);

// --------------------------------------------------
// CONTAGEM PLAYWRIGHT
// --------------------------------------------------

function classifyPlaywrightFile(file) {
  const normalizedFile = file.replace(/\\/g, '/').toLowerCase();

  if (/(^|\/)api\/|api\.spec\./.test(normalizedFile)) {
    return 'api';
  }

  if (/(^|\/)web\/|ecommerce\.spec\./.test(normalizedFile)) {
    return 'web';
  }

  return 'other';
}

function countPlaywright(json) {
  const result = {
    unique: {
      total: 0,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0
    },
    executions: {
      total: 0,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0
    },
    suites: {
      api: { unique: 0, executions: 0 },
      web: { unique: 0, executions: 0 },
      other: { unique: 0, executions: 0 }
    }
  };

  if (!json || !Array.isArray(json.suites)) {
    return result;
  }

  const uniqueTests = new Map();

  function processSuites(suites) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        const file = spec.file || suite.file || '';
        const line = spec.line ?? '';
        const title = spec.title || 'Teste sem título';

        const identity = [file, line, title].join('|');
        const category = classifyPlaywrightFile(file);

        for (const test of spec.tests || []) {
          const status = classifyPlaywrightTest(test);

          result.executions.total++;
          result.executions[status]++;
          result.suites[category].executions++;

          if (!uniqueTests.has(identity)) {
            uniqueTests.set(identity, {
              category,
              statuses: []
            });
          }

          uniqueTests.get(identity).statuses.push(status);
        }
      }

      processSuites(suite.suites);
    }
  }

  processSuites(json.suites);

  for (const test of uniqueTests.values()) {
    result.unique.total++;
    result.suites[test.category].unique++;

    const statuses = test.statuses;

    let finalStatus;

    if (statuses.includes('failed')) {
      finalStatus = 'failed';
    } else if (statuses.includes('flaky')) {
      finalStatus = 'flaky';
    } else if (statuses.every(status => status === 'skipped')) {
      finalStatus = 'skipped';
    } else {
      finalStatus = 'passed';
    }

    result.unique[finalStatus]++;
  }

  return result;
}

const playwrightCount = countPlaywright(playwright);

// --------------------------------------------------
// MÉTRICAS K6
// --------------------------------------------------

const k6DurationConfig = {
  main: {
    plannedSeconds: 540,
    tolerance: 0.20
  },
  local: {
    plannedSeconds: 15,
    tolerance: 0.20
  }
};

function evaluateDuration(runDuration, config) {
  if (
    !config ||
    typeof runDuration !== 'number' ||
    !Number.isFinite(runDuration) ||
    runDuration <= 0
  ) {
    return {
      available: false,
      consistent: false,
      status: 'SEM DADOS',
      planned: config?.plannedSeconds ?? null,
      recorded: runDuration
    };
  }

  const recordedSeconds = runDuration / 1000;

  const difference =
    Math.abs(recordedSeconds - config.plannedSeconds) /
    config.plannedSeconds;

  const consistent = difference <= config.tolerance;

  return {
    available: true,
    consistent,
    status: consistent
      ? 'CONSISTENTE COM O PLANEJAMENTO'
      : 'DIVERGÊNCIA IDENTIFICADA',
    planned: config.plannedSeconds,
    recorded: runDuration,
    differencePercent: difference * 100
  };
}

function getK6Data(data) {
  const metrics = data?.metrics || {};

  return {
    metrics,
    duration: metrics.http_req_duration?.values || {},
    requests: metrics.http_reqs?.values || {},
    failed: metrics.http_req_failed?.values || {},
    checks: metrics.checks?.values || {},
    vus: metrics.vus_max?.values || {},
    runDuration: data?.state?.testRunDurationMs ?? null
  };
}

function evaluateK6Thresholds(data, fallbackChecks) {
  const metrics = data?.metrics || {};
  const configuredThresholds = [];

  for (const metric of Object.values(metrics)) {
    for (const threshold of Object.values(metric?.thresholds || {})) {
      if (typeof threshold === 'boolean') {
        configuredThresholds.push(threshold);
      } else if (typeof threshold?.ok === 'boolean') {
        configuredThresholds.push(threshold.ok);
      }
    }
  }

  if (configuredThresholds.length > 0) {
    return {
      available: true,
      passed: configuredThresholds.every(Boolean),
      total: configuredThresholds.length,
      passedCount: configuredThresholds.filter(Boolean).length
    };
  }

  const fallback = fallbackChecks || [];

  if (
    fallback.length === 0 ||
    fallback.some(value => typeof value !== 'boolean')
  ) {
    return {
      available: false,
      passed: false,
      total: 0,
      passedCount: 0
    };
  }

  return {
    available: true,
    passed: fallback.every(Boolean),
    total: fallback.length,
    passedCount: fallback.filter(Boolean).length
  };
}

function getK6Profile(data, durationConfig = null) {
  const values = getK6Data(data);

  const fallbackChecks = [
    typeof values.failed.rate === 'number' &&
      values.failed.rate < 0.01,

    typeof values.duration['p(95)'] === 'number' &&
      values.duration['p(95)'] < 1000,

    typeof values.checks.rate === 'number' &&
      values.checks.rate > 0.99
  ];

  const thresholdResult = evaluateK6Thresholds(
    data,
    fallbackChecks
  );

  const durationResult = evaluateDuration(
    values.runDuration,
    durationConfig
  );

  return {
    ...values,
    available: !!data,
    thresholdResult,
    durationResult,
    passed: thresholdResult.available && thresholdResult.passed
  };
}

const smokeProfile = getK6Profile(smoke);

const loadProfile = getK6Profile(
  load,
  k6DurationConfig.main
);

const loadLocalProfile = getK6Profile(
  loadLocal,
  k6DurationConfig.local
);

// Variáveis utilizadas na apresentação do dashboard.
const smokeAvailable = smokeProfile.available;
const loadAvailable = loadProfile.available;
const loadLocalAvailable = loadLocalProfile.available;

const smokePassed = smokeProfile.passed;

const smokeDuration = smokeProfile.duration;
const smokeRequests = smokeProfile.requests;
const smokeFailed = smokeProfile.failed;
const smokeChecks = smokeProfile.checks;

const loadRequests = loadProfile.requests;

const loadLocalRequests = loadLocalProfile.requests;

// --------------------------------------------------
// DISPONIBILIDADE DOS RELATÓRIOS
// --------------------------------------------------

const playwrightAvailable =
  !!playwright && Array.isArray(playwright.suites);

const playwrightPassed =
  playwrightAvailable &&
  playwrightCount.executions.total > 0 &&
  playwrightCount.executions.failed === 0 &&
  playwrightCount.executions.flaky === 0;

const reports = [
  statusCard(
    'Cucumber Web - HTML',
    exists('reports/html/index.html'),
    '../html/index.html'
  ),
  statusCard(
    'Cucumber API - JSON',
    exists('reports/api/cucumber-api-report.json') ||
      exists('reports/cucumber-api-report.json'),
    exists('reports/api/cucumber-api-report.json')
      ? '../api/cucumber-api-report.json'
      : '../cucumber-api-report.json'
  ),
  statusCard(
    'Playwright - HTML',
    exists('playwright-report/index.html'),
    '../../playwright-report/index.html'
  ),
  statusCard(
    'K6 Smoke - HTML',
    exists('reports/performance/smoke-report.html'),
    '../performance/smoke-report.html'
  ),
  statusCard(
    'K6 Load Principal - HTML',
    exists('reports/performance/load-report.html'),
    '../performance/load-report.html',
    'Perfil principal de carga'
  ),
  statusCard(
    'K6 Load Local - HTML',
    exists('reports/performance/load-local-report.html'),
    '../performance/load-local-report.html',
    'Perfil local de curta duração'
  )
];

// --------------------------------------------------
// TABELAS CUCUMBER
// --------------------------------------------------

function renderCucumberBrowserRows(count) {
  return Object.entries(count.browsers)
    .map(([browser, values]) => `
      <tr>
        <td>${browser}</td>
        <td>${formatInteger(values.total)}</td>
        <td>${formatInteger(values.passed)}</td>
        <td>${formatInteger(values.failed)}</td>
        <td>${formatInteger(values.skipped)}</td>
        <td>${formatInteger(values.steps)}</td>
      </tr>
    `)
    .join('');
}

// --------------------------------------------------
// RENDERIZAÇÃO DOS PERFIS K6
// --------------------------------------------------

function renderK6Profile(title, profile, label) {
  if (!profile.available) {
    return `
      <section class="panel">
        <h3>${title}</h3>
        <p class="warning">Resumo JSON não encontrado.</p>
        <p>Execute o teste e gere o relatório correspondente.</p>
      </section>
    `;
  }

  const duration = profile.duration;
  const requests = profile.requests;
  const failed = profile.failed;
  const checks = profile.checks;
  const vus = profile.vus;

  const threshold = profile.thresholdResult;
  const durationResult = profile.durationResult;

  const thresholdText = !threshold.available
    ? 'Não foi possível confirmar os thresholds.'
    : profile.passed
      ? 'Todos os thresholds configurados foram atendidos.'
      : 'Um ou mais thresholds foram reprovados.';

  const thresholdClass = profile.passed ? 'success' : 'warning';

  const durationClass = !durationResult.available
    ? 'warning'
    : durationResult.consistent
      ? 'success'
      : 'warning';

  return `
    <section class="panel">
      <h3>${title}</h3>

      <h4>Status dos thresholds</h4>

      <p class="${thresholdClass}">
        ${thresholdText}
      </p>

      <p>
        Thresholds aprovados:
        ${formatInteger(threshold.passedCount)}
        /
        ${formatInteger(threshold.total)}
      </p>

      <h4>Consistência da duração</h4>

      <p class="${durationClass}">
        ${durationResult.status}
      </p>

      <p>
        Duração planejada:
        ${
          durationResult.available
            ? formatDuration(durationResult.planned * 1000)
            : 'N/D'
        }
      </p>

      <p>
        Duração registrada pelo K6:
        ${formatDuration(profile.runDuration)}
      </p>

      ${
        durationResult.available
          ? `<p>
              Diferença em relação ao planejamento:
              ${formatNumber(durationResult.differencePercent)}%
            </p>`
          : ''
      }

      <p class="muted">${label}</p>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Resultado</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Usuários virtuais máximos</td>
              <td>${formatInteger(vus.max ?? vus.value)}</td>
            </tr>

            <tr>
              <td>Total de requisições</td>
              <td>${formatInteger(requests.count)}</td>
            </tr>

            <tr>
              <td>Throughput</td>
              <td>${formatNumber(requests.rate)} req/s</td>
            </tr>

            <tr>
              <td>Tempo médio de resposta</td>
              <td>${formatNumber(duration.avg)} ms</td>
            </tr>

            <tr>
              <td>Mínimo</td>
              <td>${formatNumber(duration.min)} ms</td>
            </tr>

            <tr>
              <td>Mediana (P50)</td>
              <td>${formatNumber(duration.med)} ms</td>
            </tr>

            <tr>
              <td>P90</td>
              <td>${formatNumber(duration['p(90)'])} ms</td>
            </tr>

            <tr>
              <td>P95</td>
              <td>${formatNumber(duration['p(95)'])} ms</td>
            </tr>

            <tr>
              <td>P99</td>
              <td>${formatNumber(duration['p(99)'])} ms</td>
            </tr>

            <tr>
              <td>Máximo</td>
              <td>${formatNumber(duration.max)} ms</td>
            </tr>

            <tr>
              <td>Falhas HTTP</td>
              <td>${
                typeof failed.rate === 'number'
                  ? `${formatNumber(failed.rate * 100)}%`
                  : 'N/D'
              }</td>
            </tr>

            <tr>
              <td>Checks aprovados</td>
              <td>${formatInteger(checks.passes)}</td>
            </tr>

            <tr>
              <td>Checks reprovados</td>
              <td>${formatInteger(checks.fails)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// --------------------------------------------------
// HTML DO DASHBOARD
// --------------------------------------------------

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Dashboard QA - Outsera</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f3f5f9;
  color: #243047;
}

header {
  background: #172b4d;
  color: white;
  padding: 32px 6%;
}

header h1 {
  margin: 0 0 10px;
}

main {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

h2 {
  color: #243b64;
  margin-top: 35px;
}

h3 {
  margin-top: 0;
}

h4 {
  margin-bottom: 8px;
  color: #344563;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.card,
.panel {
  background: white;
  border-radius: 10px;
  padding: 22px;
  box-shadow: 0 2px 9px rgba(0,0,0,.06);
}

.metric {
  font-size: 27px;
  font-weight: bold;
  color: #243b64;
}

.success {
  color: #16803c;
  font-weight: bold;
}

.warning {
  color: #a56b00;
  font-weight: bold;
}

.muted {
  color: #667085;
  font-size: 13px;
}

a {
  color: #1769aa;
  font-weight: bold;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 600px;
}

th,
td {
  text-align: left;
  padding: 13px;
  border-bottom: 1px solid #e5e8ef;
}

th {
  background: #e9edf5;
}

footer {
  text-align: center;
  padding: 25px;
  color: #667085;
}

@media (max-width: 600px) {
  header {
    padding: 25px 20px;
  }

  .metric {
    font-size: 23px;
  }
}
</style>
</head>

<body>

<header>
  <h1>Dashboard de Qualidade - Outsera</h1>
  <p>Visão consolidada dos testes Web, API, Playwright e Performance</p>
  <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
</header>

<main>

<h2>Resumo Cucumber BDD</h2>

<section class="grid">

  <article class="card">
    <h3>BDD Web - Cenários únicos</h3>
    <div class="metric">
      ${webReports.length ? formatInteger(webCount.unique.total) : 'N/D'}
    </div>
    <p class="success">${formatInteger(webCount.unique.passed)} aprovados</p>
    <p class="warning">${formatInteger(webCount.unique.failed)} reprovados</p>
    <p>Ignorados: ${formatInteger(webCount.unique.skipped)}</p>
  </article>

  <article class="card">
    <h3>BDD Web - Execuções</h3>
    <div class="metric">
      ${webReports.length ? formatInteger(webCount.executions.total) : 'N/D'}
    </div>
    <p>Aprovadas: ${formatInteger(webCount.executions.passed)}</p>
    <p>Reprovadas: ${formatInteger(webCount.executions.failed)}</p>
    <p>Ignoradas: ${formatInteger(webCount.executions.skipped)}</p>
    <p>Steps: ${formatInteger(webCount.steps)}</p>
  </article>

  <article class="card">
    <h3>BDD API - Cenários únicos</h3>
    <div class="metric">
      ${Array.isArray(api) ? formatInteger(apiCount.unique.total) : 'N/D'}
    </div>
    <p class="success">${formatInteger(apiCount.unique.passed)} aprovados</p>
    <p class="warning">${formatInteger(apiCount.unique.failed)} reprovados</p>
    <p>Ignorados: ${formatInteger(apiCount.unique.skipped)}</p>
  </article>

  <article class="card">
    <h3>BDD API - Execuções</h3>
    <div class="metric">
      ${Array.isArray(api) ? formatInteger(apiCount.executions.total) : 'N/D'}
    </div>
    <p>Aprovadas: ${formatInteger(apiCount.executions.passed)}</p>
    <p>Reprovadas: ${formatInteger(apiCount.executions.failed)}</p>
    <p>Steps: ${formatInteger(apiCount.steps)}</p>
  </article>

</section>

<h2>BDD Web - Execuções por navegador</h2>

<section class="panel table-wrapper">

  <table>
    <thead>
      <tr>
        <th>Navegador</th>
        <th>Execuções</th>
        <th>Aprovadas</th>
        <th>Reprovadas</th>
        <th>Ignoradas</th>
        <th>Steps</th>
      </tr>
    </thead>

    <tbody>
      ${renderCucumberBrowserRows(webCount) ||
        '<tr><td colspan="6">Relatórios Web não encontrados.</td></tr>'}
    </tbody>
  </table>

  <p class="muted">
    Cenários únicos são deduplicados pela funcionalidade, linha e nome.
    Execuções representam cada navegador. A suíte API é contabilizada separadamente.
  </p>

</section>

<h2>Resumo Playwright</h2>

<section class="grid">

  <article class="card">
    <h3>Testes únicos</h3>
    <div class="metric">
      ${playwrightAvailable ? formatInteger(playwrightCount.unique.total) : 'N/D'}
    </div>
    <p class="success">${formatInteger(playwrightCount.unique.passed)} aprovados</p>
    <p class="warning">${formatInteger(playwrightCount.unique.failed)} reprovados</p>
    <p>Instáveis: ${formatInteger(playwrightCount.unique.flaky)}</p>
    <p>Ignorados: ${formatInteger(playwrightCount.unique.skipped)}</p>
  </article>

  <article class="card">
    <h3>Execuções</h3>
    <div class="metric">
      ${playwrightAvailable ? formatInteger(playwrightCount.executions.total) : 'N/D'}
    </div>
    <p>Aprovadas: ${formatInteger(playwrightCount.executions.passed)}</p>
    <p>Reprovadas: ${formatInteger(playwrightCount.executions.failed)}</p>
    <p>Instáveis: ${formatInteger(playwrightCount.executions.flaky)}</p>
    <p>Ignoradas: ${formatInteger(playwrightCount.executions.skipped)}</p>
  </article>

  <article class="card">
    <h3>Playwright API</h3>
    <div class="metric">
      ${formatInteger(playwrightCount.suites.api.unique)}
    </div>
    <p>Testes únicos</p>
    <p>Execuções: ${formatInteger(playwrightCount.suites.api.executions)}</p>
  </article>

  <article class="card">
    <h3>Playwright Web</h3>
    <div class="metric">
      ${formatInteger(playwrightCount.suites.web.unique)}
    </div>
    <p>Testes únicos</p>
    <p>Execuções: ${formatInteger(playwrightCount.suites.web.executions)}</p>
  </article>

</section>

<p class="${playwrightPassed ? 'success' : 'warning'}">
  ${
    !playwrightAvailable
      ? 'Relatório Playwright JSON não encontrado ou inválido.'
      : playwrightCount.executions.total === 0
        ? 'Nenhuma execução Playwright encontrada.'
        : playwrightPassed
          ? 'Todas as execuções Playwright foram aprovadas, sem testes instáveis.'
          : `${formatInteger(playwrightCount.executions.failed)} execuções com falha ou testes instáveis.`
  }
</p>

<h2>Detalhamento Playwright</h2>

<section class="panel table-wrapper">

  <table>
    <thead>
      <tr>
        <th>Suíte</th>
        <th>Testes únicos</th>
        <th>Execuções</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>API</td>
        <td>${formatInteger(playwrightCount.suites.api.unique)}</td>
        <td>${formatInteger(playwrightCount.suites.api.executions)}</td>
      </tr>

      <tr>
        <td>Web</td>
        <td>${formatInteger(playwrightCount.suites.web.unique)}</td>
        <td>${formatInteger(playwrightCount.suites.web.executions)}</td>
      </tr>

      <tr>
        <td>Outros</td>
        <td>${formatInteger(playwrightCount.suites.other.unique)}</td>
        <td>${formatInteger(playwrightCount.suites.other.executions)}</td>
      </tr>
    </tbody>
  </table>

</section>

<h2>Critério de contabilização</h2>

<section class="panel">

  <p>
    <strong>Testes únicos:</strong> cada definição de cenário ou teste é
    contabilizada uma única vez, independentemente da quantidade de navegadores.
  </p>

  <p>
    <strong>Execuções:</strong> cada execução individual em um navegador
    é contabilizada separadamente.
  </p>

  <p>
    <strong>API:</strong> testes API repetidos em projetos de navegador
    aparecem uma vez na quantidade de testes únicos e separadamente na quantidade de execuções.
  </p>

  <p>
    <strong>BDD e Playwright:</strong> são apresentados separadamente.
    Não são somados em um total funcional único, pois podem validar
    fluxos iguais ou semelhantes por estratégias diferentes.
  </p>

  <p>
    <strong>Scenario Outline:</strong> cada linha de exemplo gerada pelo
    Cucumber pode representar uma execução distinta, conforme o formato do relatório.
  </p>

</section>

<h2>Performance - K6 Smoke</h2>

<section class="grid">

  <article class="card">
    <h3>Status Smoke</h3>
    <div class="metric">
      ${!smokeAvailable ? 'N/D' : smokePassed ? 'Aprovado' : 'Não aprovado'}
    </div>
    <p class="${smokePassed ? 'success' : 'warning'}">
      ${
        !smokeAvailable
          ? 'Resumo Smoke não encontrado'
          : smokePassed
            ? 'Thresholds configurados atendidos'
            : 'Thresholds não atendidos ou métricas incompletas'
      }
    </p>
  </article>

  <article class="card">
    <h3>Requisições Smoke</h3>
    <div class="metric">${formatInteger(smokeRequests.count)}</div>
    <p>Throughput: ${formatNumber(smokeRequests.rate)} req/s</p>
  </article>

  <article class="card">
    <h3>Tempo de resposta Smoke</h3>
    <div class="metric">${formatNumber(smokeDuration.avg)} ms</div>
    <p>P50: ${formatNumber(smokeDuration.med)} ms</p>
    <p>P95: ${formatNumber(smokeDuration['p(95)'])} ms</p>
    <p>P99: ${formatNumber(smokeDuration['p(99)'])} ms</p>
  </article>

  <article class="card">
    <h3>Falhas HTTP Smoke</h3>
    <div class="metric">
      ${
        typeof smokeFailed.rate === 'number'
          ? `${formatNumber(smokeFailed.rate * 100)}%`
          : 'N/D'
      }
    </div>
    <p>Checks aprovados: ${formatInteger(smokeChecks.passes)}</p>
    <p>Checks reprovados: ${formatInteger(smokeChecks.fails)}</p>
  </article>

</section>

<h2>Performance - K6 Load Principal</h2>

${renderK6Profile(
  'Load Principal',
  loadProfile,
  'Perfil principal de carga. Execução independente do perfil local.'
)}

<h2>Performance - K6 Load Local</h2>

${renderK6Profile(
  'Load Local',
  loadLocalProfile,
  'Perfil local de curta duração, executado contra o servidor local. Não representa capacidade de produção.'
)}

<section class="panel">
  <h3>Interpretação dos perfis de carga</h3>

  <p>
    <strong>Load Principal:</strong> perfil configurado para atingir
    até 500 usuários virtuais, com duração planejada de 9 minutos.
  </p>

  <p>
    <strong>Load Local:</strong> perfil curto, com duração planejada
    de 15 segundos e até 5 usuários virtuais. Seus resultados validam
    o comportamento básico e a coleta de métricas, não a capacidade
    de produção.
  </p>

  <p>
    <strong>Thresholds:</strong> avaliam os critérios de latência,
    falhas HTTP e checks funcionais definidos na configuração do K6.
  </p>

  <p>
    <strong>Consistência da duração:</strong> compara a duração planejada
    com o valor registrado em state.testRunDurationMs. É uma avaliação
    independente dos thresholds.
  </p>

  <p>
    Uma execução pode atender a todos os thresholds e ainda apresentar
    divergência de duração. Essa situação deve ser investigada antes
    de considerar o resultado plenamente validado.
  </p>

  <p>
    Os resultados dos perfis são apresentados separadamente.
    Throughput, latência, quantidade de requisições e usuários virtuais
    não devem ser somados entre execuções diferentes.
  </p>

  <p>
    P99 representa o percentil 99 da duração das requisições.
    Em execuções pequenas, essa métrica possui menor estabilidade estatística.
  </p>
</section>

<h2>Relatórios detalhados</h2>

<section class="grid">

  ${reports.join('')}

  ${statusCard(
    'Cucumber Web - Chromium JSON',
    exists('reports/web/chromium-report.json'),
    '../web/chromium-report.json'
  )}

  ${statusCard(
    'Cucumber Web - Firefox JSON',
    exists('reports/web/firefox-report.json'),
    '../web/firefox-report.json'
  )}

  ${statusCard(
    'Cucumber Web - WebKit JSON',
    exists('reports/web/webkit-report.json'),
    '../web/webkit-report.json'
  )}

  ${statusCard(
    'K6 Smoke - JSON',
    smokeAvailable,
    '../performance/smoke-summary.json'
  )}

  ${statusCard(
    'K6 Load Principal - JSON',
    loadAvailable,
    '../performance/load-summary.json'
  )}

  ${statusCard(
    'K6 Load Local - JSON',
    loadLocalAvailable,
    '../performance/load-local-summary.json'
  )}

  ${statusCard(
    'Playwright - JSON',
    exists('test-results/playwright-results.json'),
    '../../test-results/playwright-results.json'
  )}

</section>

<h2>Informações adicionais</h2>

<section class="panel">

  <p>
    BDD Web: ${
      webReports.length > 0
        ? `${formatInteger(webCount.unique.total)} cenários únicos e ${formatInteger(webCount.executions.total)} execuções.`
        : 'Relatórios JSON não localizados.'
    }
  </p>

  <p>
    BDD API: ${
      Array.isArray(api)
        ? `${formatInteger(apiCount.unique.total)} cenários únicos e ${formatInteger(apiCount.executions.total)} execuções.`
        : 'Relatório JSON não localizado.'
    }
  </p>

  <p>
    Playwright: ${
      playwrightAvailable
        ? `${formatInteger(playwrightCount.unique.total)} testes únicos e ${formatInteger(playwrightCount.executions.total)} execuções.`
        : 'Relatório JSON não localizado.'
    }
  </p>

  <p>
    K6 Smoke: ${
      smokeAvailable
        ? `${formatInteger(smokeRequests.count)} requisições registradas.`
        : 'Dados não disponíveis.'
    }
  </p>

  <p>
    K6 Load Principal: ${
      loadAvailable
        ? `${formatInteger(loadRequests.count)} requisições registradas.`
        : 'Não executado ou resumo não disponível.'
    }
  </p>

  <p>
    K6 Load Local: ${
      loadLocalAvailable
        ? `${formatInteger(loadLocalRequests.count)} requisições registradas.`
        : 'Não executado ou resumo não disponível.'
    }
  </p>

  <p>
    Último status Playwright:
    ${playwrightLastRun?.status || 'Não disponível'}.
  </p>

</section>

</main>

<footer>
  Outsera QA Automation | Dashboard de resultados
</footer>

</body>
</html>`;

// --------------------------------------------------
// GERAÇÃO DO DASHBOARD
// --------------------------------------------------

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, html, 'utf8');

console.log('[DASHBOARD] Dashboard criado com sucesso!');

console.log(
  `[DASHBOARD] BDD Web: ${webCount.unique.total} cenários únicos / ${webCount.executions.total} execuções`
);

console.log(
  `[DASHBOARD] BDD API: ${apiCount.unique.total} cenários únicos / ${apiCount.executions.total} execuções`
);

console.log(
  `[DASHBOARD] Playwright: ${playwrightCount.unique.total} testes únicos / ${playwrightCount.executions.total} execuções`
);

console.log(
  `[DASHBOARD] Playwright API: ${playwrightCount.suites.api.unique} únicos / ${playwrightCount.suites.api.executions} execuções`
);

console.log(
  `[DASHBOARD] Playwright Web: ${playwrightCount.suites.web.unique} únicos / ${playwrightCount.suites.web.executions} execuções`
);

console.log(`[DASHBOARD] K6 Smoke: ${smokeAvailable ? 'Disponível' : 'N/D'}`);

console.log(
  `[DASHBOARD] K6 Load Principal: ${loadAvailable ? 'Disponível' : 'Não executado'}`
);

console.log(
  `[DASHBOARD] K6 Load Local: ${loadLocalAvailable ? 'Disponível' : 'Não executado'}`
);

function logK6Duration(name, profile) {
  if (!profile.available) {
    console.log(`[DASHBOARD] ${name}: duração não disponível`);
    return;
  }

  const result = profile.durationResult;

  console.log(`[DASHBOARD] ${name}: ${result.status}`);

  if (result.available) {
    console.log(
      `[DASHBOARD] ${name}: planejada ${formatDuration(result.planned * 1000)} / registrada ${formatDuration(profile.runDuration)}`
    );
  }
}

logK6Duration('K6 Load Principal', loadProfile);
logK6Duration('K6 Load Local', loadLocalProfile);

console.log(`[DASHBOARD] Arquivo: ${outputFile}`);
