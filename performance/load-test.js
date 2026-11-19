
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '1m', target: 250 },
    { duration: '1m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '1m', target: 0 },
  ],

  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(90)',
    'p(95)',
    'p(99)',
  ],

  thresholds: {
    http_req_duration: [
      'p(50)<500',
      'p(95)<1000',
      'p(99)<2000',
    ],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = (__ENV.BASE_URL || '').replace(/\/+$/, '');

if (!BASE_URL) {
  throw new Error(
    'Configure BASE_URL com a URL de uma API autorizada para teste de carga.'
  );
}

function obterMetricas(data) {
  const metrics = data.metrics || {};

  const duration = metrics.http_req_duration?.values || {};
  const requests = metrics.http_reqs?.values || {};
  const failures = metrics.http_req_failed?.values || {};
  const checks = metrics.checks?.values || {};
  const vus = metrics.vus_max?.values || {};

  return {
    totalRequests: requests.count ?? null,
    throughput: requests.rate ?? null,

    avg: duration.avg ?? null,
    min: duration.min ?? null,
    p50: duration.med ?? null,
    p90: duration['p(90)'] ?? null,
    p95: duration['p(95)'] ?? null,
    p99: duration['p(99)'] ?? null,
    max: duration.max ?? null,

    errorRate: failures.rate ?? null,
    checkRate: checks.rate ?? null,

    maxVus: vus.max ?? vus.value ?? 0,

    durationMs: data.state?.testRunDurationMs ?? null,
  };
}

function formatar(valor, casas = 2) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(Number(valor))
  ) {
    return 'N/D';
  }

  return Number(valor).toFixed(casas);
}

function avaliar(valor, operador, esperado) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(Number(valor))
  ) {
    return false;
  }

  if (operador === '<') {
    return valor < esperado;
  }

  if (operador === '>') {
    return valor > esperado;
  }

  return false;
}

function gerarAnalise(data, dataExecucao) {
  const m = obterMetricas(data);

  const limites = [
    {
      nome: 'p50 < 500 ms',
      valor: m.p50,
      operador: '<',
      esperado: 500,
    },
    {
      nome: 'p95 < 1000 ms',
      valor: m.p95,
      operador: '<',
      esperado: 1000,
    },
    {
      nome: 'p99 < 2000 ms',
      valor: m.p99,
      operador: '<',
      esperado: 2000,
    },
    {
      nome: 'HTTP failures < 1%',
      valor: m.errorRate,
      operador: '<',
      esperado: 0.01,
    },
    {
      nome: 'Checks > 99%',
      valor: m.checkRate,
      operador: '>',
      esperado: 0.99,
    },
  ];

  const avaliados = limites.map(item => {
    const disponivel =
      item.valor !== null &&
      item.valor !== undefined &&
      Number.isFinite(Number(item.valor));

    return {
      ...item,
      disponivel,
      aprovado: disponivel
        ? avaliar(item.valor, item.operador, item.esperado)
        : false,
    };
  });

  const aprovados = avaliados.filter(
    item => item.disponivel && item.aprovado
  ).length;

  const reprovados = avaliados.filter(
    item => item.disponivel && !item.aprovado
  ).length;

  const naoAvaliados = avaliados.filter(
    item => !item.disponivel
  ).length;

  const resultado =
    naoAvaliados > 0
      ? 'INCONCLUSIVO'
      : reprovados > 0
        ? 'REPROVADO'
        : 'APROVADO';

  const duracaoSegundos =
    m.durationMs !== null
      ? m.durationMs / 1000
      : null;

  const amostraExploratoria = m.totalRequests >= 10000;

  const linhas = [
    '# Performance Test - Load Test',
    '',
    `Date: ${dataExecucao.toISOString()}`,
    `Test URL: ${BASE_URL}`,
    '',
    '## Execution summary',
    '',
    `- Total requests: ${m.totalRequests ?? 'N/D'}`,
    `- Throughput: ${formatar(m.throughput)} req/s`,
    `- Maximum VUs: ${m.maxVus}`,
    `- Duration: ${formatar(duracaoSegundos)} seconds`,
    '',
    '## Latency',
    '',
    `- Average: ${formatar(m.avg)} ms`,
    `- Minimum: ${formatar(m.min)} ms`,
    `- p50: ${formatar(m.p50)} ms`,
    `- p90: ${formatar(m.p90)} ms`,
    `- p95: ${formatar(m.p95)} ms`,
    `- p99: ${formatar(m.p99)} ms`,
    `- Maximum: ${formatar(m.max)} ms`,
    '',
    '## Reliability',
    '',
    `- HTTP failures: ${formatar(m.errorRate !== null ? m.errorRate * 100 : null)}%`,
    `- Passed checks: ${formatar(m.checkRate !== null ? m.checkRate * 100 : null)}%`,
    '',
    '## Threshold evaluation',
    '',
    ...avaliados.map(item => {
      if (!item.disponivel) {
        return `- NOT EVALUATED: ${item.nome} (metric unavailable)`;
      }

      return `- ${item.aprovado ? 'PASSED' : 'FAILED'}: ${item.nome}`;
    }),
    '',
    `- Passed: ${aprovados}`,
    `- Failed: ${reprovados}`,
    `- Not evaluated: ${naoAvaliados}`,
    `- Overall result: ${resultado}`,
    '',
    '## Sample analysis',
    '',
    `- Requests collected: ${m.totalRequests ?? 'N/D'}`,
    amostraExploratoria
      ? 'The run has at least 10,000 requests. Percentiles can be used for exploratory analysis, but do not establish statistical certainty.'
      : 'The run has fewer than 10,000 requests. Treat p95 and p99 as exploratory indicators, not stable capacity evidence.',
    '',
    '## Environment limitations',
    '',
    '- Results depend on the tested API and its infrastructure.',
    '- Network, DNS, proxy, CDN and geographic distance can affect latency.',
    '- Virtual users do not necessarily represent the same number of active human users.',
    '- Throughput depends on response time, pacing and the configured workload.',
    '- This test does not establish a production SLA or maximum system capacity.',
    '- Repeat tests in a controlled environment to establish a baseline.',
    '',
    '## Threshold assumptions',
    '',
    '- p50 below 500 ms: provisional target.',
    '- p95 below 1000 ms: provisional target.',
    '- p99 below 2000 ms: provisional target.',
    '- HTTP failures below 1%: provisional reliability target.',
    '- Checks above 99%: provisional functional target.',
    '- Calibrate these values against business requirements and an agreed SLA.',
    '',
    '## Conclusion',
    '',
    resultado === 'INCONCLUSIVO'
      ? 'Some thresholds could not be evaluated because metrics were unavailable.'
      : resultado === 'APROVADO'
        ? 'All configured thresholds were met in this execution. Repeat the test before establishing a reliable baseline.'
        : 'One or more thresholds failed. Investigate the affected metrics before approving the execution.',
    '',
    'Throughput is reported as an observed metric and has no minimum pass threshold.',
  ];

  return {
    resultado,
    linhas: linhas.join('\n'),
  };
}

export default function () {
  const response = http.get(`${BASE_URL}/users`, {
    timeout: '10s',
    tags: {
      endpoint: 'GET /users',
      test_type: 'load',
    },
  });

  check(response, {
    'HTTP status is 200': r => r.status === 200,
    'Response is not empty': r =>
      Boolean(r.body && r.body.length > 0),
    'Content-Type is JSON': r =>
      Boolean(r.headers['Content-Type']?.includes('application/json')),
  });

  sleep(1);
}

export function handleSummary(data) {
  const dataExecucao = new Date();

  const timestamp = dataExecucao
    .toISOString()
    .replace(/[:.]/g, '-');

  const historicoPath =
    `reports/performance/history/load/load-${timestamp}.json`;

  const analise = gerarAnalise(data, dataExecucao);

  const historico = {
    metadata: {
      testType: 'load',
      generatedAt: dataExecucao.toISOString(),
      testUrl: BASE_URL,
      result: analise.resultado,
    },
    summary: data,
  };

  return {
    'reports/performance/load-summary.json':
      JSON.stringify(data, null, 2),

    'reports/performance/load-analysis.md':
      analise.linhas,

    [historicoPath]:
      JSON.stringify(historico, null, 2),
  };
}
