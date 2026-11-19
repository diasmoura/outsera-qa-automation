
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 5,

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
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = (__ENV.BASE_URL || '').replace(/\/+$/, '');

if (!BASE_URL || BASE_URL.includes('SUA-API-AUTORIZADA')) {
  throw new Error('Configure uma URL válida na variável BASE_URL.');
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

export default function () {
  const response = http.get(`${BASE_URL}/users`, {
    timeout: '10s',
    tags: {
      endpoint: 'GET /users',
      test_type: 'smoke',
    },
  });

  check(response, {
    'Status HTTP 200': r => r.status === 200,
    'Resposta não vazia': r => Boolean(r.body && r.body.length > 0),
    'Content-Type JSON': r =>
      Boolean(r.headers['Content-Type']?.includes('application/json')),
  });

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics || {};

  const duration = metrics.http_req_duration?.values || {};
  const requests = metrics.http_reqs?.values || {};
  const failures = metrics.http_req_failed?.values || {};
  const checks = metrics.checks?.values || {};
  const vus = metrics.vus_max?.values || {};

  const total = requests.count ?? 0;
  const throughput = requests.rate ?? null;
  const errorRate = failures.rate ?? null;
  const checkRate = checks.rate ?? null;
  const p95 = duration['p(95)'];

  const durationValue = data.state?.testRunDurationMs;

  const durationSeconds =
    durationValue !== null && durationValue !== undefined
      ? durationValue / 1000
      : null;

  // Avaliação dos três thresholds obrigatórios.
  const limites = [
    {
      nome: 'Falhas HTTP abaixo de 1%',
      valor: errorRate,
      disponivel: Number.isFinite(errorRate),
      aprovado: Number.isFinite(errorRate) && errorRate < 0.01,
    },
    {
      nome: 'Checks acima de 99%',
      valor: checkRate,
      disponivel: Number.isFinite(checkRate),
      aprovado: Number.isFinite(checkRate) && checkRate > 0.99,
    },
    {
      nome: 'P95 abaixo de 1000 ms',
      valor: p95,
      disponivel: Number.isFinite(p95),
      aprovado: Number.isFinite(p95) && p95 < 1000,
    },
  ];

  const aprovados = limites.filter(
    item => item.disponivel && item.aprovado
  ).length;

  const reprovados = limites.filter(
    item => item.disponivel && !item.aprovado
  ).length;

  const indisponiveis = limites.filter(
    item => !item.disponivel
  ).length;

  const resultado =
    indisponiveis > 0
      ? 'INCONCLUSIVO'
      : reprovados > 0
        ? 'REPROVADO'
        : 'APROVADO';

  const dataExecucao = new Date();

  const timestamp = dataExecucao
    .toISOString()
    .replace(/[:.]/g, '-');

  const historicoPath =
    `reports/performance/history/smoke/smoke-${timestamp}.json`;

  // Geração da análise em Markdown.
  const linhas = [
    '# Relatório de Performance - Smoke Test',
    '',
    `Data: ${dataExecucao.toISOString()}`,
    `URL testada: ${BASE_URL}`,
    '',
    '## 1. Resumo da execução',
    '',
    `- Requisições: ${total}`,
    `- Throughput: ${formatar(throughput)} req/s`,
    `- VUs máximos: ${vus.max ?? vus.value ?? 0}`,
    `- Duração: ${formatar(durationSeconds)} segundos`,
    '',
    '## 2. Latência',
    '',
    `- Média: ${formatar(duration.avg)} ms`,
    `- Mínima: ${formatar(duration.min)} ms`,
    `- Mediana (p50): ${formatar(duration.med)} ms`,
    `- p90: ${formatar(duration['p(90)'])} ms`,
    `- p95: ${formatar(p95)} ms`,
    `- p99: ${formatar(duration['p(99)'])} ms`,
    `- Máxima: ${formatar(duration.max)} ms`,
    '',
    '## 3. Confiabilidade',
    '',
    `- Falhas HTTP: ${formatar(errorRate !== null ? errorRate * 100 : null)}%`,
    `- Checks aprovados: ${formatar(checkRate !== null ? checkRate * 100 : null)}%`,
    '',
    '## 4. Avaliação dos thresholds',
    '',
    '| Critério | Resultado | Status |',
    '|---|---:|---|',
    ...limites.map(item => {
      if (!item.disponivel) {
        return `| ${item.nome} | N/D | SEM DADOS |`;
      }

      let valorFormatado;

      if (item.nome === 'Falhas HTTP abaixo de 1%') {
        valorFormatado = `${formatar(item.valor * 100)}%`;
      } else if (item.nome === 'Checks acima de 99%') {
        valorFormatado = `${formatar(item.valor * 100)}%`;
      } else {
        valorFormatado = `${formatar(item.valor)} ms`;
      }

      const status = item.aprovado ? 'APROVADO' : 'REPROVADO';

      return `| ${item.nome} | ${valorFormatado} | ${status} |`;
    }),
    '',
    `**Resultado geral: ${resultado}**`,
    '',
    `- Thresholds aprovados: ${aprovados}`,
    `- Thresholds reprovados: ${reprovados}`,
    `- Thresholds sem dados: ${indisponiveis}`,
    '',
    '## 5. Limitações estatísticas',
    '',
    `- A execução possui ${total} requisições.`,
    '- O P95 possui threshold obrigatório de 1000 ms.',
    '- p90 e p99 são indicadores informativos.',
    '- A amostra pequena não comprova capacidade de carga ou SLA.',
    '- O Smoke Test é destinado à verificação rápida de confiabilidade.',
    '',
    '## 6. Limitações do ambiente',
    '',
    '- Rede, DNS, proxy, CDN e infraestrutura remota podem influenciar a latência.',
    '- O teste utiliza apenas 1 usuário virtual.',
    '- O throughput observado não representa capacidade máxima.',
    '- Repetir os testes em ambiente controlado para construir uma baseline.',
    '',
    '## 7. Conclusão',
    '',
    resultado === 'APROVADO'
      ? 'Todos os thresholds obrigatórios foram atendidos nesta execução. O resultado não comprova capacidade de carga.'
      : resultado === 'REPROVADO'
        ? 'Um ou mais thresholds obrigatórios não foram atendidos. Investigar antes de aprovar.'
        : 'Existem métricas obrigatórias ausentes. Não é possível aprovar esta execução.',
  ];

  // Histórico individual da execução.
  const historico = {
    metadata: {
      testType: 'smoke',
      generatedAt: dataExecucao.toISOString(),
      testUrl: BASE_URL,
      result: resultado,
      thresholds: limites.map(item => ({
        name: item.nome,
        value: item.valor ?? null,
        available: item.disponivel,
        passed: item.disponivel ? item.aprovado : null,
      })),
    },
    summary: data,
  };

  return {
    'reports/performance/smoke-summary.json':
      JSON.stringify(data, null, 2),

    'reports/performance/smoke-analysis.md':
      linhas.join('\n'),

    [historicoPath]:
      JSON.stringify(historico, null, 2),
  };
}
