
const fs = require('fs');

const input = 'reports/performance/smoke-summary.json';
const output = 'reports/performance/smoke-report.html';

if (!fs.existsSync(input)) {
  console.error('Arquivo smoke-summary.json não encontrado.');
  process.exit(1);
}

let report;

try {
  report = JSON.parse(fs.readFileSync(input, 'utf8'));
} catch (error) {
  console.error('Erro ao interpretar o JSON:', error.message);
  process.exit(1);
}

const metrics = report.metrics || {};

const values = name => metrics[name]?.values || {};

const duration = values('http_req_duration');
const failed = values('http_req_failed');
const checks = values('checks');
const requests = values('http_reqs');
const vus = values('vus_max');

const format = (value, decimals = 2) =>
  Number.isFinite(value) ? value.toFixed(decimals) : 'N/D';

const percentage = value =>
  Number.isFinite(value)
    ? `${(value * 100).toFixed(2)}%`
    : 'N/D';

const totalRequests = requests.count ?? null;
const throughput = requests.rate ?? null;
const errorRate = failed.rate ?? null;
const checkRate = checks.rate ?? null;

const durationValue = report.state?.testRunDurationMs;

const durationSeconds =
  durationValue !== null && durationValue !== undefined
    ? durationValue / 1000
    : null;

// O Smoke Test não utiliza thresholds de latência.
// Os percentis são apenas indicadores informativos.
const thresholds = [
  {
    name: 'Falhas HTTP abaixo de 1%',
    value: errorRate,
    available: Number.isFinite(errorRate),
    passed: Number.isFinite(errorRate) && errorRate < 0.01,
    actual: percentage(errorRate),
  },
  {
    name: 'Checks acima de 99%',
    value: checkRate,
    available: Number.isFinite(checkRate),
    passed: Number.isFinite(checkRate) && checkRate > 0.99,
    actual: percentage(checkRate),
  },
];

const approved = thresholds.filter(item =>
  item.available && item.passed
).length;

const failedThresholds = thresholds.filter(item =>
  item.available && !item.passed
).length;

const unavailable = thresholds.filter(item =>
  !item.available
).length;

const conclusion =
  unavailable > 0
    ? 'INCONCLUSIVO: existem métricas obrigatórias ausentes.'
    : failedThresholds > 0
      ? 'REPROVADO: um ou mais thresholds não foram atendidos.'
      : 'APROVADO: todos os thresholds de confiabilidade foram atendidos.';

const rows = thresholds.map(item => {
  const status = !item.available
    ? 'SEM DADOS'
    : item.passed
      ? 'APROVADO'
      : 'REPROVADO';

  const cssClass = !item.available
    ? 'neutral'
    : item.passed
      ? 'pass'
      : 'fail';

  return `
    <tr>
      <td>${item.name}</td>
      <td>${item.actual}</td>
      <td class="${cssClass}">${status}</td>
    </tr>
  `;
}).join('');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Relatório Smoke Test - k6</title>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 30px;
  color: #222;
  background: #f5f6f8;
}

.container {
  max-width: 1000px;
  margin: auto;
  padding: 25px;
  background: white;
  border-radius: 8px;
}

h1, h2 {
  color: #243b64;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 25px;
}

th, td {
  border: 1px solid #ddd;
  padding: 11px;
  text-align: left;
}

th {
  background: #e9edf5;
}

.pass {
  color: #16803c;
  font-weight: bold;
}

.fail {
  color: #c62828;
  font-weight: bold;
}

.neutral {
  color: #9a6700;
  font-weight: bold;
}

.conclusion {
  padding: 15px;
  border: 1px solid #ccc;
  font-weight: bold;
  margin-top: 20px;
}

.note {
  background: #fff3cd;
  padding: 15px;
  margin-top: 20px;
}
</style>
</head>

<body>
<div class="container">

<h1>Relatório de Performance - Smoke Test</h1>

<p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

<h2>1. Resumo da execução</h2>

<table>
<tr><th>Indicador</th><th>Resultado</th></tr>
<tr><td>VUs máximos</td><td>${vus.max ?? vus.value ?? 'N/D'}</td></tr>
<tr><td>Total de requisições</td><td>${totalRequests ?? 'N/D'}</td></tr>
<tr><td>Throughput</td><td>${format(throughput)} req/s</td></tr>
<tr><td>Duração</td><td>${format(durationSeconds)} segundos</td></tr>
<tr><td>Falhas HTTP</td><td>${percentage(errorRate)}</td></tr>
<tr><td>Checks aprovados</td><td>${checks.passes ?? 'N/D'}</td></tr>
<tr><td>Checks reprovados</td><td>${checks.fails ?? 'N/D'}</td></tr>
</table>

<h2>2. Latência</h2>

<table>
<tr><th>Métrica</th><th>Resultado</th></tr>
<tr><td>Média</td><td>${format(duration.avg)} ms</td></tr>
<tr><td>Mínima</td><td>${format(duration.min)} ms</td></tr>
<tr><td>p50</td><td>${format(duration.med)} ms</td></tr>
<tr><td>p90</td><td>${format(duration['p(90)'])} ms</td></tr>
<tr><td>p95</td><td>${format(duration['p(95)'])} ms</td></tr>
<tr><td>p99</td><td>${format(duration['p(99)'])} ms</td></tr>
<tr><td>Máxima</td><td>${format(duration.max)} ms</td></tr>
</table>

<h2>3. Avaliação dos thresholds</h2>

<table>
<tr>
  <th>Critério</th>
  <th>Resultado</th>
  <th>Status</th>
</tr>
${rows}
</table>

<p>
Thresholds aprovados: ${approved} |
Reprovados: ${failedThresholds} |
Sem dados: ${unavailable}
</p>

<div class="conclusion">${conclusion}</div>

<div class="note">
<strong>Limitações do Smoke Test:</strong>
<ul>
<li>Execução configurada para 1 VU e 5 iterações.</li>
<li>p50, p90, p95 e p99 são indicadores informativos.</li>
<li>Não existem thresholds de latência neste teste.</li>
<li>Uma amostra pequena não comprova capacidade de carga ou SLA.</li>
<li>Rede, DNS, proxy e infraestrutura externa podem influenciar os resultados.</li>
</ul>
</div>

</div>
</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');

console.log(`Relatório criado: ${output}`);
console.log(conclusion);
