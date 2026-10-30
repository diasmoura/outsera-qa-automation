
const fs = require('fs');

const input = 'reports/performance/smoke-summary.json';
const output = 'reports/performance/smoke-report.html';

if (!fs.existsSync(input)) {
  console.error('Arquivo JSON não encontrado.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(input, 'utf8'));
const metrics = report.metrics || {};

const duration = metrics.http_req_duration?.values || {};
const failed = metrics.http_req_failed?.values || {};
const checks = metrics.checks?.values || {};
const requests = metrics.http_reqs?.values || {};
const vus = metrics.vus_max?.values || {};

const format = (value) =>
  typeof value === 'number' ? value.toFixed(2) : 'N/A';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Performance K6</title>
<style>
body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
h1 { color: #243b64; }
table { border-collapse: collapse; width: 100%; max-width: 800px; }
th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
th { background: #eee; }
.status { color: green; font-weight: bold; }
</style>
</head>
<body>
<h1>Relatório de Teste de Performance - K6</h1>
<p><strong>Endpoint:</strong> https://jsonplaceholder.typicode.com/users</p>
<p class="status">Validação básica concluída</p>
<table>
<tr><th>Métrica</th><th>Resultado</th></tr>
<tr><td>Usuários virtuais máximos</td><td>${vus.max ?? 'N/A'}</td></tr>
<tr><td>Total de requisições</td><td>${requests.count ?? 'N/A'}</td></tr>
<tr><td>Tempo médio</td><td>${format(duration.avg)} ms</td></tr>
<tr><td>Mediana</td><td>${format(duration.med)} ms</td></tr>
<tr><td>Percentil 90</td><td>${format(duration['p(90)'])} ms</td></tr>
<tr><td>Percentil 95</td><td>${format(duration['p(95)'])} ms</td></tr>
<tr><td>Falhas HTTP</td><td>${format((failed.rate ?? 0) * 100)}%</td></tr>
<tr><td>Checks aprovados</td><td>${checks.passes ?? 'N/A'}</td></tr>
<tr><td>Checks reprovados</td><td>${checks.fails ?? 'N/A'}</td></tr>
</table>
<p>Teste básico: 1 VU e 5 iterações. Não representa o teste de carga de 500 VUs.</p>
</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');
console.log('Relatório HTML criado: ' + output);
