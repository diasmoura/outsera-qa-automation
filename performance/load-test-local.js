
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 2 },
    { duration: '5s', target: 5 },
    { duration: '5s', target: 0 },
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

function obterStatusThreshold(data, nomeMetrica, expressao) {
  const threshold = data.metrics?.[nomeMetrica]?.thresholds?.[expressao];

  if (typeof threshold === 'boolean') {
    return threshold ? 'APROVADO' : 'REPROVADO';
  }

  if (typeof threshold?.ok === 'boolean') {
    return threshold.ok ? 'APROVADO' : 'REPROVADO';
  }

  return 'SEM DADOS';
}

function gerarAnalise(data, dataExecucao) {
  const m = obterMetricas(data);

  const limites = [
    {
      nome: 'p50 < 500 ms',
      metrica: 'http_req_duration',
      expressao: 'p(50)<500',
      justificativa: 'Referência provisória para latência típica.',
    },
    {
      nome: 'p95 < 1000 ms',
      metrica: 'http_req_duration',
      expressao: 'p(95)<1000',
      justificativa: 'Referência provisória para controlar a cauda de latência.',
    },
    {
      nome: 'p99 < 2000 ms',
      metrica: 'http_req_duration',
      expressao: 'p(99)<2000',
      justificativa: 'Referência provisória para acompanhar respostas muito lentas.',
    },
    {
      nome: 'HTTP failures < 1%',
      metrica: 'http_req_failed',
      expressao: 'rate<0.01',
      justificativa: 'Referência provisória de confiabilidade.',
    },
    {
      nome: 'Checks > 99%',
      metrica: 'checks',
      expressao: 'rate>0.99',
      justificativa: 'Referência provisória de consistência funcional.',
    },
  ];

  const avaliados = limites.map(item => ({
    ...item,
    status: obterStatusThreshold(
      data,
      item.metrica,
      item.expressao
    ),
  }));

  const aprovados = avaliados.filter(
    item => item.status === 'APROVADO'
  ).length;

  const reprovados = avaliados.filter(
    item => item.status === 'REPROVADO'
  ).length;

  const naoAvaliados = avaliados.filter(
    item => item.status === 'SEM DADOS'
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

  const linhas = [
    '# Performance Test - Local Load Test',
    '',
    `Date: ${dataExecucao.toISOString()}`,
    `Test URL: ${BASE_URL}`,
    '',
    '## Execution profile',
    '',
    '- Profile: Local short load test',
    '- Configured stages: 2 VUs, 5 VUs and ramp-down',
    '- Maximum configured VUs: 5',
    '- This profile is not equivalent to the main 500-VU load test.',
    '',
    '## Execution summary',
    '',
    `- Total requests: ${m.totalRequests ?? 'N/D'}`,
    `- Throughput: ${formatar(m.throughput)} req/s`,
    `- Maximum observed VUs: ${m.maxVus}`,
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
    ...avaliados.map(item =>
      `- ${item.status}: ${item.nome} - ${item.justificativa}`
    ),
    '',
    `- Passed: ${aprovados}`,
    `- Failed: ${reprovados}`,
    `- Not evaluated: ${naoAvaliados}`,
    `- Overall result: ${resultado}`,
    '',
    '## Sample analysis',
    '',
    `- Requests collected: ${m.totalRequests ?? 'N/D'}`,
    '- This short execution is intended for local validation of the test script and target API.',
    '- p95 and p99 are exploratory indicators with this workload and sample size.',
    '- A small sample does not establish statistical stability or system capacity.',
    '',
    '## Environment limitations',
    '',
    '- Results depend on the target API and its infrastructure.',
    '- Network, DNS, proxy, CDN and geographic distance can affect latency.',
    '- Virtual users do not represent the same number of active human users.',
    '- Throughput depends on response time, pacing and configured workload.',
    '- This local profile does not establish a production SLA or maximum capacity.',
    '- Repeat tests in a controlled environment to establish a representative baseline.',
    '',
    '## Threshold assumptions',
    '',
    '- p50 below 500 ms: provisional latency target.',
    '- p95 below 1000 ms: provisional latency target.',
    '- p99 below 2000 ms: provisional tail-latency target.',
    '- HTTP failures below 1%: provisional reliability target.',
    '- Checks above 99%: provisional functional target.',
    '- Calibrate these values against business requirements and an agreed SLA/SLO.',
    '- Throughput is observed and has no minimum pass threshold.',
    '',
    '## Conclusion',
    '',
    resultado === 'INCONCLUSIVO'
      ? 'Some thresholds could not be evaluated from the K6 summary.'
      : resultado === 'APROVADO'
        ? 'All configured thresholds were met in this local execution. This does not prove production capacity.'
        : 'One or more thresholds failed. Investigate the affected metrics before approving the execution.',
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
      test_type: 'load-local',
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
    `reports/performance/history/load-local/load-local-${timestamp}.json`;

  const analise = gerarAnalise(data, dataExecucao);

  const historico = {
    metadata: {
      testType: 'load-local',
      generatedAt: dataExecucao.toISOString(),
      testUrl: BASE_URL,
      result: analise.resultado,
      profile: 'local-short-load',
      maxConfiguredVus: 5,
    },
    summary: data,
  };

  return {
    'reports/performance/load-local-summary.json':
      JSON.stringify(data, null, 2),

    'reports/performance/load-local-analysis.md':
      analise.linhas,

    [historicoPath]:
      JSON.stringify(historico, null, 2),
  };
}
