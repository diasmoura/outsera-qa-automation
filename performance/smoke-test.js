
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL || BASE_URL.includes('SUA-API-AUTORIZADA')) {
  throw new Error('Configure uma URL válida na variável BASE_URL.');
}

export default function () {
  const response = http.get(`${BASE_URL}/users`, {
    timeout: '10s',
  });

  check(response, {
    'Status HTTP 200': (r) => r.status === 200,
    'Resposta não vazia': (r) => Boolean(r.body && r.body.length > 0),
    'Content-Type JSON': (r) =>
      Boolean(r.headers['Content-Type']?.includes('application/json')),
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/performance/smoke-summary.json': JSON.stringify(data, null, 2),
  };
}
