
const fs = require('fs');
const path = require('path');

const root = __dirname;
const reportsDir = path.join(root, 'reports');
const outputDir = path.join(reportsDir, 'consolidated');
const outputFile = path.join(outputDir, 'index.html');

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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function formatNumber(value, decimals = 2) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    : 'Não disponível';
}

function formatInteger(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR')
    : 'Não disponível';
}

function statusCard(name, available, href) {
  return `
    <article class="card">
      <h3>${name}</h3>
      <p class="${available ? 'success' : 'warning'}">
        ${available ? 'Relatório disponível' : 'Não encontrado'}
      </p>
      ${available
        ? `<a href="${href}">Abrir relatório</a>`
        : '<span>Execute ou gere o relatório correspondente.</span>'}
    </article>
  `;
}

// Arquivos de resultados
const api = readJson('reports/cucumber-api-report.json');
const web = readJson('reports/cucumber-web-report.json');
const playwright = readJson('test-results/playwright-results.json');

const load = readJson('reports/performance/load-summary.json');
const smoke = readJson('reports/performance/smoke-summary.json');
const playwrightLastRun = readJson('test-results/.last-run.json');

// Métricas K6
const loadMetrics = load?.metrics || {};
const duration = loadMetrics.http_req_duration?.values || {};
const requests = loadMetrics.http_reqs?.values || {};
const failed = loadMetrics.http_req_failed?.values || {};
const checks = loadMetrics.checks?.values || {};
const vus = loadMetrics.vus_max?.values || {};

const smokeMetrics = smoke?.metrics || {};
const smokeRequests = smokeMetrics.http_reqs?.values || {};

// Contagem Cucumber
function countCucumber(json) {
  const result = {
    scenarios: 0,
    passed: 0,
    failed: 0,
    steps: 0
  };

  if (!Array.isArray(json)) return result;

  for (const feature of json) {
    for (const element of feature.elements || []) {
      if (
        element.type === 'scenario' ||
        element.type === 'scenario_outline'
      ) {
        result.scenarios++;

        const scenarioSteps = element.steps || [];
        const hasFailure = scenarioSteps.some(step =>
          ['failed', 'ambiguous', 'undefined'].includes(step.result?.status)
        );

        if (hasFailure) {
          result.failed++;
        } else {
          result.passed++;
        }

        result.steps += scenarioSteps.length;
      }
    }
  }

  return result;
}

// Contagem Playwright
// Cada objeto test representa um teste em um projeto.
// As tentativas de retry não são contadas como novos testes.
function countPlaywright(json) {
  const result = {
    total: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0
  };

  if (!json || !Array.isArray(json.suites)) {
    return result;
  }

  function classifyTest(test) {
    if (test.status === 'expected') return 'passed';
    if (test.status === 'unexpected') return 'failed';
    if (test.status === 'flaky') return 'flaky';
    if (test.status === 'skipped') return 'skipped';

    const attempts = test.results || [];
    const lastAttempt = attempts[attempts.length - 1];

    if (lastAttempt?.status === 'passed') return 'passed';
    if (lastAttempt?.status === 'skipped') return 'skipped';

    if (
      lastAttempt?.status === 'failed' ||
      lastAttempt?.status === 'timedOut' ||
      lastAttempt?.status === 'interrupted'
    ) {
      return 'failed';
    }

    return 'failed';
  }

  function processSuites(suites) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          result.total++;

          const status = classifyTest(test);
          result[status]++;
        }
      }

      processSuites(suite.suites);
    }
  }

  processSuites(json.suites);

  return result;
}

const apiCount = countCucumber(api);
const webCount = countCucumber(web);
const playwrightCount = countPlaywright(playwright);

// Totais funcionais
const totalScenarios = apiCount.scenarios + webCount.scenarios;
const totalSteps = apiCount.steps + webCount.steps;

const totalFunctional =
  totalScenarios + playwrightCount.total;

const totalPassed =
  apiCount.passed +
  webCount.passed +
  playwrightCount.passed;

const totalFailed =
  apiCount.failed +
  webCount.failed +
  playwrightCount.failed;

const approvalRate = totalFunctional > 0
  ? (totalPassed / totalFunctional) * 100
  : 0;

const playwrightAvailable = !!playwright;
const playwrightPassed =
  playwrightAvailable &&
  playwrightCount.total > 0 &&
  playwrightCount.failed === 0;

const loadPassed =
  typeof failed.rate === 'number' &&
  failed.rate < 0.01 &&
  typeof duration['p(95)'] === 'number' &&
  duration['p(95)'] < 1000 &&
  typeof checks.rate === 'number' &&
  checks.rate > 0.99;

const smokeAvailable = !!smoke;
const loadAvailable = !!load;

// Relatórios
const reports = [
  statusCard(
    'Cucumber Web',
    exists('reports/html/index.html'),
    '../html/index.html'
  ),
  statusCard(
    'Playwright',
    exists('playwright-report/index.html'),
    '../../playwright-report/index.html'
  ),
  statusCard(
    'K6 Smoke',
    exists('reports/performance/smoke-report.html'),
    '../performance/smoke-report.html'
  ),
  statusCard(
    'K6 Load',
    exists('reports/performance/load-report.html'),
    '../performance/load-report.html'
  )
];

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard QA - Outsera</title>

<style>
* { box-sizing: border-box; }

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

header h1 { margin: 0 0 10px; }

main {
  max-width: 1150px;
  margin: 30px auto;
  padding: 0 20px;
}

h2 {
  color: #243b64;
  margin-top: 35px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.card, .panel {
  background: white;
  border-radius: 10px;
  padding: 22px;
  box-shadow: 0 2px 9px rgba(0,0,0,.06);
}

.card h3 { margin-top: 0; }

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

a {
  color: #1769aa;
  font-weight: bold;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th, td {
  text-align: left;
  padding: 13px;
  border-bottom: 1px solid #e5e8ef;
}

th { background: #e9edf5; }

footer {
  text-align: center;
  padding: 25px;
  color: #667085;
}

@media (max-width: 600px) {
  header { padding: 25px 20px; }
  .metric { font-size: 23px; }
}
</style>
</head>

<body>

<header>
  <h1>Dashboard de Qualidade - Outsera</h1>
  <p>Visão consolidada dos testes automatizados Web, API e Performance</p>
  <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
</header>

<main>

  <h2>Resumo das execuções</h2>

  <section class="grid">

    <article class="card">
      <h3>Cenários BDD</h3>
      <div class="metric">${formatInteger(totalScenarios)}</div>
      <p>Web: ${web ? formatInteger(webCount.scenarios) : 'N/D'}</p>
      <p>API: ${api ? formatInteger(apiCount.scenarios) : 'N/D'}</p>
    </article>

    <article class="card">
      <h3>Steps BDD</h3>
      <div class="metric">${formatInteger(totalSteps)}</div>
      <p>Web: ${formatInteger(webCount.steps)}</p>
      <p>API: ${formatInteger(apiCount.steps)}</p>
    </article>

    <article class="card">
      <h3>Playwright</h3>
      <div class="metric">
        ${playwrightAvailable
          ? `${formatInteger(playwrightCount.passed)} / ${formatInteger(playwrightCount.total)}`
          : 'N/D'}
      </div>
      <p class="${playwrightPassed ? 'success' : 'warning'}">
        ${playwrightPassed
          ? 'Todos os testes aprovados'
          : playwrightAvailable
            ? `${formatInteger(playwrightCount.failed)} falhas | ${formatInteger(playwrightCount.skipped)} ignorados`
            : 'Relatório JSON não encontrado'}
      </p>
      <p>Testes instáveis: ${formatInteger(playwrightCount.flaky)}</p>
    </article>

    <article class="card">
      <h3>Total funcional</h3>
      <div class="metric">
        ${formatInteger(totalFunctional)}
      </div>
      <p class="success">
        ${formatInteger(totalPassed)} aprovados
      </p>
      <p class="${totalFailed > 0 ? 'warning' : 'success'}">
        ${formatInteger(totalFailed)} reprovados
      </p>
    </article>

    <article class="card">
      <h3>Taxa de aprovação</h3>
      <div class="metric">
        ${totalFunctional > 0
          ? `${formatNumber(approvalRate)}%`
          : 'N/D'}
      </div>
      <p>Considera BDD e Playwright</p>
    </article>

    <article class="card">
      <h3>K6 Load</h3>
      <div class="metric">
        ${loadPassed ? 'Aprovado' : 'Não confirmado'}
      </div>
      <p>${formatInteger(requests.count)} requisições</p>
    </article>

  </section>

  <h2>Detalhamento dos testes funcionais</h2>

  <section class="panel">
    <table>
      <tr>
        <th>Suíte</th>
        <th>Total</th>
        <th>Aprovados</th>
        <th>Reprovados</th>
      </tr>

      <tr>
        <td>BDD Web</td>
        <td>${formatInteger(webCount.scenarios)}</td>
        <td>${formatInteger(webCount.passed)}</td>
        <td>${formatInteger(webCount.failed)}</td>
      </tr>

      <tr>
        <td>BDD API</td>
        <td>${formatInteger(apiCount.scenarios)}</td>
        <td>${formatInteger(apiCount.passed)}</td>
        <td>${formatInteger(apiCount.failed)}</td>
      </tr>

      <tr>
        <td>Playwright</td>
        <td>${playwrightAvailable ? formatInteger(playwrightCount.total) : 'N/D'}</td>
        <td>${formatInteger(playwrightCount.passed)}</td>
        <td>${formatInteger(playwrightCount.failed)}</td>
      </tr>
    </table>
  </section>

  <h2>Resultados de Performance - K6 Load</h2>

  <section class="panel">
    <table>
      <tr><th>Métrica</th><th>Resultado</th></tr>
      <tr><td>Usuários virtuais máximos</td><td>${formatInteger(vus.max)}</td></tr>
      <tr><td>Total de requisições</td><td>${formatInteger(requests.count)}</td></tr>
      <tr><td>Requisições por segundo</td><td>${formatNumber(requests.rate)}</td></tr>
      <tr><td>Tempo médio de resposta</td><td>${formatNumber(duration.avg)} ms</td></tr>
      <tr><td>Mediana</td><td>${formatNumber(duration.med)} ms</td></tr>
      <tr><td>p90</td><td>${formatNumber(duration['p(90)'])} ms</td></tr>
      <tr><td>p95</td><td>${formatNumber(duration['p(95)'])} ms</td></tr>
      <tr><td>Falhas HTTP</td><td>${formatNumber(
        typeof failed.rate === 'number' ? failed.rate * 100 : undefined
      )}%</td></tr>
      <tr><td>Checks aprovados</td><td>${formatInteger(checks.passes)}</td></tr>
      <tr><td>Checks reprovados</td><td>${formatInteger(checks.fails)}</td></tr>
    </table>

    <p class="${loadPassed ? 'success' : 'warning'}">
      ${loadPassed
        ? 'Thresholds de carga atendidos.'
        : 'Não foi possível confirmar todos os thresholds.'}
    </p>
  </section>

  <h2>Relatórios detalhados</h2>

  <section class="grid">
    ${reports.join('')}

    ${statusCard(
      'Cucumber API - JSON',
      exists('reports/cucumber-api-report.json'),
      '../cucumber-api-report.json'
    )}

    ${statusCard(
      'K6 Smoke - JSON',
      !!smoke,
      '../performance/smoke-summary.json'
    )}

    ${statusCard(
      'Playwright - JSON',
      exists('test-results/playwright-results.json'),
      '../../test-results/playwright-results.json'
    )}
  </section>

  <h2>Informações adicionais</h2>

  <section class="panel">
    <p>BDD Web: ${web ? `${formatInteger(webCount.scenarios)} cenários identificados.` : 'JSON não localizado.'}</p>

    <p>BDD API: ${api ? `${formatInteger(apiCount.scenarios)} cenários identificados.` : 'JSON não localizado.'}</p>

    <p>Playwright: ${
      playwrightAvailable
        ? `${formatInteger(playwrightCount.total)} testes identificados no relatório JSON.`
        : 'Relatório JSON não localizado. Verifique o reporter no playwright.config.js.'
    }</p>

    <p>Smoke test: ${
      smokeAvailable
        ? `${formatInteger(smokeRequests.count)} requisições registradas.`
        : 'Dados não disponíveis.'
    }</p>

    <p>Último status Playwright: ${
      playwrightLastRun?.status || 'Não disponível'
    }.</p>
  </section>

</main>

<footer>
  Outsera QA Automation | Dashboard de resultados
</footer>

</body>
</html>`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, html, 'utf8');

console.log('[DASHBOARD] Dashboard criado com sucesso!');
console.log(`[DASHBOARD] Arquivo: ${outputFile}`);
console.log(`[DASHBOARD] BDD Web: ${webCount.scenarios} cenários`);
console.log(`[DASHBOARD] BDD API: ${apiCount.scenarios} cenários`);
console.log(`[DASHBOARD] Playwright: ${playwrightCount.passed}/${playwrightCount.total} aprovados`);
console.log(`[DASHBOARD] Total funcional: ${totalPassed}/${totalFunctional} aprovados`);
