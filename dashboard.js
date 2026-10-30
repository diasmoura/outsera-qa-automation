
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
    console.warn(`[DASHBOARD] Não foi possível ler ${relativePath}`);
    return null;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function formatNumber(value, decimals = 2) {
  return typeof value === 'number'
    ? value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    : 'Não disponível';
}

function formatInteger(value) {
  return typeof value === 'number'
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

const api = readJson('reports/cucumber-api-report.json');
const web = readJson('reports/cucumber-web-report.json');
const load = readJson('reports/performance/load-summary.json');
const smoke = readJson('reports/performance/smoke-summary.json');
const playwrightLastRun = readJson('test-results/.last-run.json');

const loadMetrics = load?.metrics || {};
const duration = loadMetrics.http_req_duration?.values || {};
const requests = loadMetrics.http_reqs?.values || {};
const failed = loadMetrics.http_req_failed?.values || {};
const checks = loadMetrics.checks?.values || {};
const vus = loadMetrics.vus_max?.values || {};

const smokeMetrics = smoke?.metrics || {};
const smokeRequests = smokeMetrics.http_reqs?.values || {};

function countCucumber(json) {
  if (!Array.isArray(json)) return { scenarios: 0, steps: 0 };

  let scenarios = 0;
  let steps = 0;

  for (const feature of json) {
    for (const element of feature.elements || []) {
      if (element.type === 'scenario' || element.type === 'scenario_outline') {
        scenarios++;
      }

      steps += (element.steps || []).length;
    }
  }

  return { scenarios, steps };
}

const apiCount = countCucumber(api);
const webCount = countCucumber(web);

const totalScenarios = apiCount.scenarios + webCount.scenarios;
const totalSteps = apiCount.steps + webCount.steps;

const playwrightPassed = playwrightLastRun?.status === 'passed';

const loadPassed =
  typeof failed.rate === 'number' &&
  failed.rate < 0.01 &&
  typeof duration['p(95)'] === 'number' &&
  duration['p(95)'] < 1000 &&
  typeof checks.rate === 'number' &&
  checks.rate > 0.99;

const smokeAvailable = !!smoke;
const loadAvailable = !!load;

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
h2 { color: #243b64; margin-top: 35px; }
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
.success { color: #16803c; font-weight: bold; }
.warning { color: #a56b00; font-weight: bold; }
a { color: #1769aa; font-weight: bold; }
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
      <p>Web: ${api ? formatInteger(webCount.scenarios) : 'N/D'} |
         API: ${api ? formatInteger(apiCount.scenarios) : 'N/D'}</p>
    </article>

    <article class="card">
      <h3>Steps BDD</h3>
      <div class="metric">${formatInteger(totalSteps)}</div>
      <p>Web e API</p>
    </article>

    <article class="card">
      <h3>Playwright</h3>
      <div class="metric">${playwrightPassed ? 'Aprovado' : 'Não confirmado'}</div>
      <p class="${playwrightPassed ? 'success' : 'warning'}">
        ${playwrightPassed
          ? 'Último registro: passed'
          : 'Consulte o relatório detalhado'}
      </p>
    </article>

    <article class="card">
      <h3>K6 Load</h3>
      <div class="metric">${loadPassed ? 'Aprovado' : 'Não confirmado'}</div>
      <p>${formatInteger(requests.count)} requisições</p>
    </article>
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
      'Cucumber API',
      exists('reports/cucumber-api-report.json'),
      '../cucumber-api-report.json'
    )}
    ${statusCard(
      'K6 Smoke - JSON',
      !!smoke,
      '../performance/smoke-summary.json'
    )}
  </section>

  <h2>Informações adicionais</h2>
  <section class="panel">
    <p>Smoke test: ${smokeAvailable
      ? `${formatInteger(smokeRequests.count)} requisições registradas`
      : 'Dados não disponíveis'}.</p>
    <p>BDD Web: ${api ? formatInteger(webCount.scenarios) : 'JSON não localizado'} cenários identificados.</p>
    <p>BDD API: ${api ? formatInteger(apiCount.scenarios) : 'JSON não localizado'} cenários identificados.</p>
    <p>Playwright: o arquivo .last-run.json registra
      ${playwrightPassed ? 'status passed' : 'status não confirmado'}.
      A quantidade de testes não é inferida desse arquivo.</p>
  </section>
</main>

<footer>Outsera QA Automation | Dashboard de resultados</footer>
</body>
</html>`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, html, 'utf8');

console.log('[DASHBOARD] Dashboard criado com sucesso!');
console.log(`[DASHBOARD] Arquivo: ${outputFile}`);
