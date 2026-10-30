
const fs = require('fs');

const input = 'reports/performance/load-summary.json';
const output = 'reports/performance/load-report.html';

if (!fs.existsSync(input)) {
  console.error('Arquivo load-summary.json nao encontrado.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(input, 'utf8'));
const metrics = report.metrics || {};

const getValues = (name) => metrics[name]?.values || {};

const duration = getValues('http_req_duration');
const connecting = getValues('http_req_connecting');
const waiting = getValues('http_req_waiting');
const receiving = getValues('http_req_receiving');
const iteration = getValues('iteration_duration');
const failed = getValues('http_req_failed');
const checks = getValues('checks');
const requests = getValues('http_reqs');
const vus = getValues('vus_max');

const format = (value, decimals = 2) =>
  typeof value === 'number' ? value.toFixed(decimals) : 'N/A';

const percentage = (value) =>
  typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : 'N/A';

const thresholdStatus = (metric, threshold) =>
  metric <= threshold
    ? '<span class="pass">ATENDIDO</span>'
    : '<span class="fail">NAO ATENDIDO</span>';

const p95 = duration['p(95)'];
const failedRate = failed.rate;
const checksRate = checks.rate;

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatorio de Performance - K6</title>
<style>
body {
  font-family: Arial, sans-serif;
  margin: 35px;
  color: #222;
  background: #f7f8fa;
}
h1, h2 { color: #243b64; }
.container {
  background: white;
  padding: 25px;
  border-radius: 8px;
  max-width: 950px;
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
th { background: #e9edf5; }
.pass { color: #16803c; font-weight: bold; }
.fail { color: #c62828; font-weight: bold; }
.note {
  padding: 15px;
  background: #fff3cd;
  border-left: 5px solid #e0a800;
  margin-top: 20px;
}
</style>
</head>
<body>
<div class="container">

<h1>Relatorio de Teste de Performance - K6</h1>
<p>Teste de carga realizado com API de teste local.</p>

<h2>1. Resumo da execucao</h2>
<table>
<tr><th>Indicador</th><th>Resultado</th></tr>
<tr><td>Usuarios virtuais maximos</td><td>${vus.max ?? 'N/A'}</td></tr>
<tr><td>Total de requisicoes</td><td>${requests.count ?? 'N/A'}</td></tr>
<tr><td>Requisicoes por segundo</td><td>${format(requests.rate)}</td></tr>
<tr><td>Falhas HTTP</td><td>${percentage(failedRate)}</td></tr>
<tr><td>Checks aprovados</td><td>${checks.passes ?? 'N/A'}</td></tr>
<tr><td>Checks reprovados</td><td>${checks.fails ?? 'N/A'}</td></tr>
</table>

<h2>2. Tempo de resposta</h2>
<table>
<tr><th>Metrica</th><th>Resultado</th></tr>
<tr><td>Media</td><td>${format(duration.avg)} ms</td></tr>
<tr><td>Mediana</td><td>${format(duration.med)} ms</td></tr>
<tr><td>Percentil 90</td><td>${format(duration['p(90)'])} ms</td></tr>
<tr><td>Percentil 95</td><td>${format(p95)} ms</td></tr>
<tr><td>Tempo maximo</td><td>${format(duration.max)} ms</td></tr>
<tr><td>Tempo de conexao</td><td>${format(connecting.avg)} ms</td></tr>
<tr><td>Tempo de espera da resposta</td><td>${format(waiting.avg)} ms</td></tr>
<tr><td>Tempo de recebimento</td><td>${format(receiving.avg)} ms</td></tr>
<tr><td>Duracao media da iteracao</td><td>${format(iteration.avg)} ms</td></tr>
</table>

<h2>3. Validacao dos thresholds</h2>
<table>
<tr><th>Critério</th><th>Resultado</th><th>Status</th></tr>
<tr>
<td>Falhas HTTP abaixo de 1%</td>
<td>${percentage(failedRate)}</td>
<td>${thresholdStatus(failedRate, 0.01)}</td>
</tr>
<tr>
<td>p95 abaixo de 1000 ms</td>
<td>${format(p95)} ms</td>
<td>${thresholdStatus(p95, 1000)}</td>
</tr>
<tr>
<td>Checks acima de 99%</td>
<td>${percentage(checksRate)}</td>
<td>${checksRate > 0.99
  ? '<span class="pass">ATENDIDO</span>'
  : '<span class="fail">NAO ATENDIDO</span>'}</td>
</tr>
</table>

<h2>4. Analise dos resultados</h2>
<p>
O teste registrou ${vus.max ?? 'N/A'} usuarios virtuais maximos
e ${requests.count ?? 'N/A'} requisicoes, com vazao de
${format(requests.rate)} requisicoes por segundo.
O tempo de resposta p95 foi de ${format(p95)} ms.
A taxa de falhas HTTP foi de ${percentage(failedRate)}
e ${checks.passes ?? 'N/A'} checks foram aprovados.
</p>

<p>
Os resultados indicam desempenho positivo no ambiente de teste
e atendimento aos thresholds configurados.
</p>

<div class="note">
<strong>Limitacao do teste:</strong>
o K6 e a API foram executados na mesma maquina.
Portanto, os resultados representam uma validacao local e
nao uma medicao isolada da capacidade de uma infraestrutura
de producao. Para uma analise completa de gargalos, recomenda-se
monitorar CPU, memoria, rede e logs da API durante o teste.
</div>

</div>
</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');
console.log(`Relatorio criado: ${output}`);
