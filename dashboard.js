
const fs = require('fs');
const path = require('path');

const root = __dirname;
const reportsDir = path.join(root, 'reports');
const outputDir = path.join(reportsDir, 'consolidated');
const outputFile = path.join(outputDir, 'index.html');

const DURATION_TOLERANCE_PERCENT = 20;

// --------------------------------------------------
// CONFIGURAÇÃO DOS PERFIS K6
// --------------------------------------------------

const k6DurationConfig = {
  main: {
    plannedSeconds: 540,
    plannedLabel: '9 min',
    description:
      '1 min (100 VUs) + 1 min (250 VUs) + 1 min (500 VUs) + 5 min (500 VUs) + 1 min (ramp down)'
  },
  local: {
    plannedSeconds: 15,
    plannedLabel: '15 s',
    description:
      '5 s (2 VUs) + 5 s (5 VUs) + 5 s (ramp down)'
  }
};

// --------------------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------------------

function readJson(relativePath) {
  const file = path.join(root, relativePath);

  if (!fs.existsSync(file)) return null;

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(
      `[DASHBOARD] Erro ao ler ${relativePath}: ${error.message}`
    );
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

  const parts = [];

  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} s`);
  }

  return parts.join(' ');
}

function statusCard(name, available, href, description = '') {
  return `
    <article class="card">
      <h3>${escapeHtml(name)}</h3>

      <p class="${available ? 'success' : 'warning'}">
        ${available ? 'Relatório disponível' : 'Não encontrado'}
      </p>

      ${description ? `<p>${escapeHtml(description)}</p>` : ''}

      ${
        available
          ? `<a href="${escapeHtml(href)}">Abrir relatório</a>`
          : '<span>Execute ou gere o relatório correspondente.</span>'
      }
    </article>
  `;
}

// --------------------------------------------------
// HISTÓRICO K6 COM VALIDAÇÃO DA DURAÇÃO
// --------------------------------------------------

function readLatestHistory(
  relativeDirectory,
  profileConfig = null,
  filenamePattern = /\.json$/i
) {
  const directory = path.join(root, relativeDirectory);

  if (!fs.existsSync(directory)) {
    console.warn(
      `[DASHBOARD] Diretório de histórico não encontrado: ${relativeDirectory}`
    );
    return null;
  }

  try {
    const files = fs.readdirSync(directory)
      .filter(file => filenamePattern.test(file))
      .map(file => {
        const fullPath = path.join(directory, file);

        return {
          file,
          fullPath,
          modifiedAt: fs.statSync(fullPath).mtimeMs
        };
      });

    const validHistory = [];

    for (const item of files) {
      try {
        const history = JSON.parse(
          fs.readFileSync(item.fullPath, 'utf8')
        );

        const data = history.summary || history;
        const duration = data.state?.testRunDurationMs;

        if (
          typeof duration !== 'number' ||
          !Number.isFinite(duration) ||
          duration <= 0
        ) {
          console.warn(
            `[DASHBOARD] Histórico sem duração válida: ${item.file}`
          );
          continue;
        }

        if (profileConfig) {
          const plannedMs = profileConfig.plannedSeconds * 1000;

          const minimumMs =
            plannedMs * (1 - DURATION_TOLERANCE_PERCENT / 100);

          const maximumMs =
            plannedMs * (1 + DURATION_TOLERANCE_PERCENT / 100);

          if (duration < minimumMs || duration > maximumMs) {
            console.log(
              `[DASHBOARD] Histórico descartado para este perfil: ${item.file} (${formatDuration(duration)})`
            );
            continue;
          }
        }

        const generatedAt = Date.parse(
          history.metadata?.generatedAt
        );

        const timestamp = Number.isFinite(generatedAt)
          ? generatedAt
          : item.modifiedAt;

        validHistory.push({
          data,
          metadata: history.metadata || null,
          file: item.file,
          timestamp,
          duration
        });

      } catch (error) {
        console.warn(
          `[DASHBOARD] Histórico inválido ${item.file}: ${error.message}`
        );
      }
    }

    if (validHistory.length === 0) {
      console.warn(
        `[DASHBOARD] Nenhuma execução compatível encontrada em ${relativeDirectory}.`
      );
      return null;
    }

    validHistory.sort((a, b) => b.timestamp - a.timestamp);

    const selected = validHistory[0];

    console.log(
      `[DASHBOARD] Histórico selecionado: ${selected.file}`
    );

    console.log(
      `[DASHBOARD] Duração selecionada: ${formatDuration(selected.duration)}`
    );

    console.log(
      `[DASHBOARD] Execuções compatíveis encontradas: ${validHistory.length}`
    );

    return selected;

  } catch (error) {
    console.warn(
      `[DASHBOARD] Não foi possível consultar ${relativeDirectory}: ${error.message}`
    );

    return null;
  }
}

// --------------------------------------------------
// SELEÇÃO DOS HISTÓRICOS
// --------------------------------------------------

const loadHistory = readLatestHistory(
  'reports/performance/history/load',
  k6DurationConfig.main,
  /^load-(?!local-).+\.json$/i
);

const loadLocalHistory = readLatestHistory(
  'reports/performance/history/load-local',
  k6DurationConfig.local
);

// --------------------------------------------------
// AMBIENTE DE EXECUÇÃO
// --------------------------------------------------

function getEnvironmentLabel(data, history) {
  const url =
    history?.metadata?.testUrl ||
    data?.metadata?.testUrl ||
    data?.testUrl ||
    null;

  if (!url) {
    return {
      url: null,
      label: 'Ambiente não identificado nos metadados'
    };
  }

  try {
    const parsedUrl = new URL(url);

    const isLocal = [
      'localhost',
      '127.0.0.1',
      '::1'
    ].includes(parsedUrl.hostname);

    return {
      url,
      label: isLocal
        ? 'Ambiente local'
        : 'API hospedada / ambiente remoto'
    };

  } catch {
    return {
      url,
      label: 'URL registrada, mas inválida'
    };
  }
}

// --------------------------------------------------
// RELATÓRIOS CUCUMBER
// --------------------------------------------------

const webBrowserReports = [
  {
    browser: 'Chromium',
    path: 'reports/web/chromium-report.json'
  },
  {
    browser: 'Firefox',
    path: 'reports/web/firefox-report.json'
  },
  {
    browser: 'WebKit',
    path: 'reports/web/webkit-report.json'
  }
];

const availableWebReports = webBrowserReports
  .map(item => ({
    ...item,
    data: readJson(item.path)
  }))
  .filter(item => Array.isArray(item.data));

const expectedWebBrowsers = webBrowserReports.length;
const availableWebBrowsers = availableWebReports.length;

const webReportsComplete =
  availableWebBrowsers === expectedWebBrowsers;

const webReportsPartial =
  availableWebBrowsers > 0 &&
  availableWebBrowsers < expectedWebBrowsers;

const legacyWebReport = availableWebReports.length === 0
  ? readFirstJson(['reports/cucumber-web-report.json'])
  : null;

const api = readFirstJson([
  'reports/api/cucumber-api-report.json',
  'reports/cucumber-api-report.json'
]);

// --------------------------------------------------
// RELATÓRIOS PLAYWRIGHT E K6
// --------------------------------------------------

const playwright = readJson(
  'test-results/playwright-results.json'
);

const playwrightLastRun = readJson(
  'test-results/.last-run.json'
);

const smoke = readJson(
  'reports/performance/smoke-summary.json'
);

const load = loadHistory?.data || null;

const loadLocalSummary = readJson(
  'reports/performance/load-local-summary.json'
);

const loadLocal = loadLocalHistory?.data || loadLocalSummary;

const loadEnvironment = getEnvironmentLabel(
  load,
  loadHistory
);

const loadLocalEnvironment = getEnvironmentLabel(
  loadLocal,
  loadLocalHistory
);

// --------------------------------------------------
// LINKS DOS ARQUIVOS REALMENTE APRESENTADOS
// --------------------------------------------------

const smokeJsonHref =
  '../performance/smoke-summary.json';

const loadJsonHref = loadHistory
  ? `../performance/history/load/${encodeURIComponent(loadHistory.file)}`
  : '../performance/load-summary.json';

const loadLocalJsonHref = loadLocalHistory
  ? `../performance/history/load-local/${encodeURIComponent(loadLocalHistory.file)}`
  : '../performance/load-local-summary.json';

// --------------------------------------------------
// CLASSIFICAÇÃO DE STATUS
// --------------------------------------------------

function classifyCucumberScenario(element) {
  const steps = element.steps || [];

  const hasFailure = steps.some(step =>
    ['failed', 'ambiguous', 'undefined'].includes(
      step.result?.status
    )
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
      ['failed', 'timedOut', 'interrupted'].includes(
        attempt.status
      )
    )
      ? 'flaky'
      : 'passed';
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
          uniqueScenarios.set(identity, {
            statuses: []
          });
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
    } else if (statuses.includes('skipped')) {
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
    ? [{
        browser: 'Relatório legado',
        data: legacyWebReport
      }]
    : [];

const webCount = countCucumberReports(webReports);

const apiCount = countCucumberReports(
  Array.isArray(api)
    ? [{
        browser: 'Execução única',
        data: api
      }]
    : []
);

// --------------------------------------------------
// CONTAGEM PLAYWRIGHT
// --------------------------------------------------

function classifyPlaywrightFile(file) {
  const normalizedFile = file
    .replace(/\\/g, '/')
    .toLowerCase();

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
      api: {
        unique: 0,
        executions: 0
      },
      web: {
        unique: 0,
        executions: 0
      },
      other: {
        unique: 0,
        executions: 0
      }
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
    } else if (statuses.includes('skipped')) {
      finalStatus = 'skipped';
    } else {
      finalStatus = 'passed';
    }

    result.unique[finalStatus]++;
  }

  return result;
}

const playwrightCount = countPlaywright(playwright);

const playwrightAvailable =
  !!playwright && Array.isArray(playwright.suites);

const playwrightPassed =
  playwrightAvailable &&
  playwrightCount.executions.total > 0 &&
  playwrightCount.executions.failed === 0 &&
  playwrightCount.executions.flaky === 0 &&
  playwrightCount.executions.skipped === 0;

const playwrightHasSkipped =
  playwrightAvailable &&
  playwrightCount.executions.total > 0 &&
  playwrightCount.executions.skipped > 0 &&
  playwrightCount.executions.failed === 0 &&
  playwrightCount.executions.flaky === 0;

// --------------------------------------------------
// ANÁLISE DA DURAÇÃO
// --------------------------------------------------

function assessDuration(recordedMs, plannedSeconds) {
  if (
    typeof recordedMs !== 'number' ||
    !Number.isFinite(recordedMs) ||
    recordedMs < 0 ||
    typeof plannedSeconds !== 'number' ||
    !Number.isFinite(plannedSeconds) ||
    plannedSeconds <= 0
  ) {
    return {
      status: 'SEM DADOS',
      differencePercent: null
    };
  }

  const plannedMs = plannedSeconds * 1000;

  const differencePercent =
    Math.abs(recordedMs - plannedMs) / plannedMs * 100;

  return {
    status:
      differencePercent <= DURATION_TOLERANCE_PERCENT
        ? 'CONSISTENTE COM O PLANEJAMENTO'
        : 'DIVERGÊNCIA IDENTIFICADA',
    differencePercent
  };
}

// --------------------------------------------------
// MÉTRICAS K6
// --------------------------------------------------

function getK6Data(data) {
  const metrics = data?.metrics || {};

  return {
    metrics,
    duration: metrics.http_req_duration?.values || {},
    requests: metrics.http_reqs?.values || {},
    iterations: metrics.iterations?.values || {},
    failed: metrics.http_req_failed?.values || {},
    checks: metrics.checks?.values || {},
    vus: metrics.vus?.values || {},
    vusMax: metrics.vus_max?.values || {},
    runDuration: data?.state?.testRunDurationMs ?? null
  };
}

function evaluateK6Thresholds(data, fallbackChecks) {
  const metrics = data?.metrics || {};
  const configuredThresholds = [];

  for (const metric of Object.values(metrics)) {
    for (const threshold of Object.values(
      metric?.thresholds || {}
    )) {
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

function getK6Profile(data) {
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

  const requiredMetrics = [
    'http_req_duration',
    'http_reqs',
    'http_req_failed',
    'checks'
  ];

  const hasValidMetrics =
    data?.metrics &&
    typeof data.metrics === 'object' &&
    requiredMetrics.every(metric =>
      data.metrics[metric]?.values &&
      typeof data.metrics[metric].values === 'object'
    );

  const hasValidDuration =
    typeof values.runDuration === 'number' &&
    Number.isFinite(values.runDuration) &&
    values.runDuration > 0;

  const available = Boolean(
    hasValidMetrics && hasValidDuration
  );

  return {
    ...values,
    available,
    thresholdResult,
    passed: available &&
      thresholdResult.available &&
      thresholdResult.passed
  };
}

const smokeProfile = getK6Profile(smoke);
const loadProfile = getK6Profile(load);
const loadLocalProfile = getK6Profile(loadLocal);

const loadDurationAssessment = assessDuration(
  loadProfile.runDuration,
  k6DurationConfig.main.plannedSeconds
);

const loadLocalDurationAssessment = assessDuration(
  loadLocalProfile.runDuration,
  k6DurationConfig.local.plannedSeconds
);

// --------------------------------------------------
// RELATÓRIOS DETALHADOS
// --------------------------------------------------

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
        <td>${escapeHtml(browser)}</td>
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

function renderK6Profile(
  title,
  profile,
  label,
  durationConfig,
  environment,
  history
) {
  if (!profile.available) {
    return `
      <section class="panel">
        <h3>${escapeHtml(title)}</h3>
        <p class="warning">Resumo JSON compatível não encontrado ou incompleto.</p>
        <p>
          Não foi localizada uma execução com métricas e duração válidas
          para este perfil.
        </p>
        <p>Execute novamente o teste correspondente ou confira o histórico.</p>
      </section>
    `;
  }

  const duration = profile.duration;
  const requests = profile.requests;
  const iterations = profile.iterations;
  const failed = profile.failed;
  const checks = profile.checks;
  const vus = profile.vus;
  const vusMax = profile.vusMax;
  const threshold = profile.thresholdResult;

  const durationAssessment = assessDuration(
    profile.runDuration,
    durationConfig.plannedSeconds
  );

  const statusText = !threshold.available
    ? 'Não foi possível confirmar os thresholds.'
    : profile.passed
      ? 'Todos os thresholds configurados foram atendidos.'
      : 'Um ou mais thresholds foram reprovados.';

  const statusClass = profile.passed
    ? 'success'
    : 'warning';

  const durationClass =
    durationAssessment.status ===
    'CONSISTENTE COM O PLANEJAMENTO'
      ? 'success'
      : 'warning';

  const environmentUrl = environment.url
    ? escapeHtml(environment.url)
    : 'Não registrada no histórico';

  const historyFile = history?.file || 'Resumo atual';

  const historySource = history
    ? 'Histórico validado pela duração planejada'
    : 'Resumo atual';

  return `
    <section class="panel">
      <h3>${escapeHtml(title)}</h3>

      <p class="${statusClass}">
        ${statusText}
      </p>

      <p class="muted">
        ${escapeHtml(label)}
      </p>

      <h4>Origem da execução</h4>

      <p>
        <strong>Fonte:</strong>
        ${escapeHtml(historySource)}
      </p>

      <p>
        <strong>Arquivo:</strong>
        ${escapeHtml(historyFile)}
      </p>

      <h4>Ambiente da execução</h4>

      <p>
        <strong>Classificação:</strong>
        ${escapeHtml(environment.label)}
      </p>

      <p>
        <strong>URL registrada:</strong>
        ${environmentUrl}
      </p>

      <h4>Resultado dos thresholds</h4>

      <p>
        Thresholds aprovados:
        ${formatInteger(threshold.passedCount)}
        /
        ${formatInteger(threshold.total)}
      </p>

      <h4>Análise da duração da execução</h4>

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
              <td>Duração planejada</td>
              <td>${escapeHtml(durationConfig.plannedLabel)}</td>
            </tr>

            <tr>
              <td>Etapas configuradas</td>
              <td>${escapeHtml(durationConfig.description)}</td>
            </tr>

            <tr>
              <td>Duração registrada pelo K6</td>
              <td>${formatDuration(profile.runDuration)}</td>
            </tr>

            <tr>
              <td>Duração registrada em milissegundos</td>
              <td>${formatNumber(profile.runDuration, 2)} ms</td>
            </tr>

            <tr>
              <td>Consistência da duração</td>
              <td class="${durationClass}">
                ${durationAssessment.status}
              </td>
            </tr>

            <tr>
              <td>Diferença em relação ao planejamento</td>
              <td>
                ${
                  durationAssessment.differencePercent !== null
                    ? `${formatNumber(durationAssessment.differencePercent)}%`
                    : 'N/D'
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      ${
        durationAssessment.status === 'DIVERGÊNCIA IDENTIFICADA'
          ? `
            <p class="warning">
              Atenção: a duração registrada diverge do planejamento.
              Investigue a execução antes de utilizar esta medição
              como referência de desempenho.
            </p>
          `
          : durationAssessment.status ===
            'CONSISTENTE COM O PLANEJAMENTO'
            ? `
              <p class="success">
                A duração registrada está dentro da tolerância
                definida em relação ao planejamento.
              </p>
            `
            : `
              <p class="warning">
                Não foi possível avaliar a consistência da duração.
              </p>
            `
      }

      <p class="muted">
        A comparação considera uma tolerância de
        ${DURATION_TOLERANCE_PERCENT}%.
        A divergência de duração não altera automaticamente
        a aprovação dos thresholds de performance.
      </p>

      <h4>Métricas de performance</h4>

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
              <td>Usuários virtuais observados (máximo)</td>
              <td>${formatInteger(vus.max ?? vus.value)}</td>
            </tr>

            <tr>
              <td>Usuários virtuais máximos alocados</td>
              <td>${formatInteger(vusMax.max ?? vusMax.value)}</td>
            </tr>

            <tr>
              <td>Total de requisições HTTP</td>
              <td>${formatInteger(requests.count)}</td>
            </tr>

            <tr>
              <td>Iterações concluídas</td>
              <td>${formatInteger(iterations.count)}</td>
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
              <td>
                ${
                  typeof failed.rate === 'number'
                    ? `${formatNumber(failed.rate * 100)}%`
                    : 'N/D'
                }
              </td>
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

      <p class="muted">
        Checks representam as verificações automatizadas realizadas
        nas respostas. Não representam requisições HTTP adicionais.
      </p>
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
  margin-top: 25px;
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
  vertical-align: top;
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

  .card,
  .panel {
    padding: 17px;
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
    <p>Ignoradas: ${formatInteger(apiCount.executions.skipped)}</p>
    <p>Steps: ${formatInteger(apiCount.steps)}</p>
  </article>

</section>

<h2>BDD Web - Execuções por navegador</h2>

${
  webReportsPartial
    ? `
      <section class="panel">
        <p class="warning">
          Execução parcial: ${availableWebBrowsers} de
          ${expectedWebBrowsers} relatórios de navegadores encontrados.
          Os totais apresentados não representam a suíte completa Cross-Browser.
        </p>
      </section>
    `
    : webReportsComplete
      ? `
        <section class="panel">
          <p class="success">
            Os três relatórios de navegadores foram encontrados.
          </p>
        </section>
      `
      : `
        <section class="panel">
          <p class="warning">
            Relatórios individuais de Chromium, Firefox e WebKit
            não estão todos disponíveis. Verifique a origem dos dados.
          </p>
        </section>
      `
}

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

<p class="${
  playwrightPassed || playwrightHasSkipped
    ? 'success'
    : 'warning'
}">
  ${
    !playwrightAvailable
      ? 'Relatório Playwright JSON não encontrado ou inválido.'
      : playwrightCount.executions.total === 0
        ? 'Nenhuma execução Playwright encontrada.'
        : playwrightCount.executions.failed > 0
          ? `${formatInteger(playwrightCount.executions.failed)} execuções com falha.`
          : playwrightCount.executions.flaky > 0
            ? `${formatInteger(playwrightCount.executions.flaky)} execuções instáveis.`
            : playwrightHasSkipped
              ? `Execução concluída com ${formatInteger(playwrightCount.executions.skipped)} testes ignorados. Não classificada como aprovação integral.`
              : 'Todas as execuções Playwright foram aprovadas, sem falhas, instabilidades ou testes ignorados.'
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
      ${
        !smokeProfile.available
          ? 'N/D'
          : smokeProfile.passed
            ? 'Aprovado'
            : 'Não aprovado'
      }
    </div>
    <p class="${smokeProfile.passed ? 'success' : 'warning'}">
      ${
        !smokeProfile.available
          ? 'Resumo Smoke não encontrado ou incompleto'
          : smokeProfile.passed
            ? 'Thresholds configurados atendidos'
            : 'Thresholds não atendidos ou métricas incompletas'
      }
    </p>
  </article>

  <article class="card">
    <h3>Requisições Smoke</h3>
    <div class="metric">${formatInteger(smokeProfile.requests.count)}</div>
    <p>Throughput: ${formatNumber(smokeProfile.requests.rate)} req/s</p>
  </article>

  <article class="card">
    <h3>Tempo de resposta Smoke</h3>
    <div class="metric">${formatNumber(smokeProfile.duration.avg)} ms</div>
    <p>P50: ${formatNumber(smokeProfile.duration.med)} ms</p>
    <p>P95: ${formatNumber(smokeProfile.duration['p(95)'])} ms</p>
    <p>P99: ${formatNumber(smokeProfile.duration['p(99)'])} ms</p>
  </article>

  <article class="card">
    <h3>Falhas HTTP Smoke</h3>
    <div class="metric">
      ${
        typeof smokeProfile.failed.rate === 'number'
          ? `${formatNumber(smokeProfile.failed.rate * 100)}%`
          : 'N/D'
      }
    </div>
    <p>Checks aprovados: ${formatInteger(smokeProfile.checks.passes)}</p>
    <p>Checks reprovados: ${formatInteger(smokeProfile.checks.fails)}</p>
  </article>

</section>

<h2>Performance - K6 Load Principal</h2>

${renderK6Profile(
  'Load Principal',
  loadProfile,
  'Perfil principal de carga.',
  k6DurationConfig.main,
  loadEnvironment,
  loadHistory
)}

<h2>Performance - K6 Load Local</h2>

${renderK6Profile(
  'Load Local',
  loadLocalProfile,
  'Perfil local de curta duração. Não representa capacidade de produção.',
  k6DurationConfig.local,
  loadLocalEnvironment,
  loadLocalHistory
)}

<section class="panel">
  <h3>Interpretação dos perfis de carga</h3>

  <p>
    <strong>Load Principal:</strong> representa o perfil de carga configurado
    para avaliar a API com uma quantidade maior de usuários virtuais.
    A URL registrada deve ser verificada antes de interpretar o resultado
    como desempenho de staging ou produção.
  </p>

  <p>
    <strong>Load Local:</strong> representa uma execução curta contra o ambiente
    local, quando a URL registrada identifica localhost. Seus resultados servem
    para validar o comportamento básico e a coleta de métricas.
  </p>

  <p>
    Os resultados dos dois perfis são apresentados separadamente.
    Throughput, latência, quantidade de requisições e usuários virtuais
    não devem ser somados entre execuções diferentes.
  </p>

  <p>
    P99 representa o tempo abaixo do qual ocorreram 99% das observações
    de duração das requisições. Em execuções pequenas, essa métrica possui
    menor estabilidade estatística.
  </p>

  <p>
    <strong>Checks:</strong> são as verificações automatizadas realizadas
    nas respostas. Uma iteração pode executar vários checks.
    A quantidade de checks não deve ser confundida com a quantidade de requisições.
  </p>

  <p>
    <strong>Consistência da duração:</strong> a comparação entre duração
    planejada e registrada utiliza tolerância de
    ${DURATION_TOLERANCE_PERCENT}%. Esse indicador é independente dos
    thresholds de latência, falhas HTTP e checks.
  </p>

  <p>
    <strong>Limitação:</strong> um resultado de carga executado em localhost
    não comprova capacidade de produção nem substitui um teste em staging
    com infraestrutura e dados representativos.
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
    smokeProfile.available,
    smokeJsonHref,
    'Resumo da execução Smoke atual'
  )}

  ${statusCard(
    'K6 Load Principal - JSON',
    loadProfile.available,
    loadJsonHref,
    loadHistory
      ? `Histórico selecionado: ${loadHistory.file}`
      : 'Resumo atual, sem histórico compatível'
  )}

  ${statusCard(
    'K6 Load Local - JSON',
    loadLocalProfile.available,
    loadLocalJsonHref,
    loadLocalHistory
      ? `Histórico selecionado: ${loadLocalHistory.file}`
      : 'Resumo atual, sem histórico compatível'
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
    Relatórios Web:
    ${availableWebBrowsers} de ${expectedWebBrowsers} navegadores encontrados.
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
      smokeProfile.available
        ? `${formatInteger(smokeProfile.requests.count)} requisições registradas.`
        : 'Dados não disponíveis.'
    }
  </p>

  <p>
    K6 Load Principal: ${
      loadProfile.available
        ? `${formatInteger(loadProfile.requests.count)} requisições e ${formatInteger(loadProfile.iterations.count)} iterações registradas.`
        : 'Nenhuma execução compatível com o perfil planejado foi encontrada.'
    }
  </p>

  <p>
    Histórico Load Principal:
    ${escapeHtml(loadHistory?.file || 'Não selecionado')}.
  </p>

  <p>
    Ambiente Load Principal:
    ${escapeHtml(loadEnvironment.label)}.
  </p>

  <p>
    Duração Load Principal:
    ${
      loadProfile.available
        ? `${k6DurationConfig.main.plannedLabel} planejados / ${formatDuration(loadProfile.runDuration)} registrados / ${loadDurationAssessment.status}.`
        : 'Dados não disponíveis.'
    }
  </p>

  <p>
    K6 Load Local: ${
      loadLocalProfile.available
        ? `${formatInteger(loadLocalProfile.requests.count)} requisições e ${formatInteger(loadLocalProfile.iterations.count)} iterações registradas.`
        : 'Não executado ou resumo não disponível.'
    }
  </p>

  <p>
    Histórico Load Local:
    ${escapeHtml(loadLocalHistory?.file || 'Resumo atual')}.
  </p>

  <p>
    Ambiente Load Local:
    ${escapeHtml(loadLocalEnvironment.label)}.
  </p>

  <p>
    Duração Load Local:
    ${
      loadLocalProfile.available
        ? `${k6DurationConfig.local.plannedLabel} planejados / ${formatDuration(loadLocalProfile.runDuration)} registrados / ${loadLocalDurationAssessment.status}.`
        : 'Dados não disponíveis.'
    }
  </p>

  <p>
    Último status Playwright:
    ${escapeHtml(playwrightLastRun?.status || 'Não disponível')}.
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

fs.mkdirSync(outputDir, {
  recursive: true
});

fs.writeFileSync(
  outputFile,
  html,
  'utf8'
);

console.log('[DASHBOARD] Dashboard criado com sucesso!');

console.log(
  `[DASHBOARD] BDD Web: ${webCount.unique.total} cenários únicos / ${webCount.executions.total} execuções`
);

console.log(
  `[DASHBOARD] Relatórios Web: ${availableWebBrowsers}/${expectedWebBrowsers} navegadores encontrados`
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

console.log(
  `[DASHBOARD] Playwright status integral: ${playwrightPassed ? 'APROVADO' : 'NÃO APROVADO'}`
);

console.log(
  `[DASHBOARD] K6 Smoke: ${smokeProfile.available ? 'Disponível' : 'N/D'}`
);

console.log(
  `[DASHBOARD] K6 Load Principal: ${loadProfile.available ? 'Disponível' : 'Não encontrado histórico compatível'}`
);

if (loadProfile.available) {
  console.log(
    `[DASHBOARD] K6 Load Principal - Histórico: ${loadHistory.file}`
  );

  console.log(
    `[DASHBOARD] K6 Load Principal - Ambiente: ${loadEnvironment.label}`
  );

  console.log(
    `[DASHBOARD] K6 Load Principal - Duração: ${k6DurationConfig.main.plannedLabel} planejados / ${formatDuration(loadProfile.runDuration)} registrados / ${loadDurationAssessment.status}`
  );

  console.log(
    `[DASHBOARD] K6 Load Principal - Requisições: ${formatInteger(loadProfile.requests.count)} / Iterações: ${formatInteger(loadProfile.iterations.count)}`
  );
}

console.log(
  `[DASHBOARD] K6 Load Local: ${loadLocalProfile.available ? 'Disponível' : 'Não executado'}`
);

if (loadLocalProfile.available) {
  console.log(
    `[DASHBOARD] K6 Load Local - Histórico: ${loadLocalHistory?.file || 'Resumo atual'}`
  );

  console.log(
    `[DASHBOARD] K6 Load Local - Ambiente: ${loadLocalEnvironment.label}`
  );

  console.log(
    `[DASHBOARD] K6 Load Local - Duração: ${k6DurationConfig.local.plannedLabel} planejados / ${formatDuration(loadLocalProfile.runDuration)} registrados / ${loadLocalDurationAssessment.status}`
  );
}

console.log(`[DASHBOARD] Arquivo: ${outputFile}`);
