# Performance Test - Local Load Test

Date: 2026-11-19T01:37:56.582Z
Test URL: http://localhost:3000

## Execution profile

- Profile: Local short load test
- Configured stages: 2 VUs, 5 VUs and ramp-down
- Maximum configured VUs: 5
- This profile is not equivalent to the main 500-VU load test.

## Execution summary

- Total requests: 36
- Throughput: 2.39 req/s
- Maximum observed VUs: 5
- Duration: 15.03 seconds

## Latency

- Average: 0.70 ms
- Minimum: 0.00 ms
- p50: 0.64 ms
- p90: 1.08 ms
- p95: 1.11 ms
- p99: 1.14 ms
- Maximum: 1.15 ms

## Reliability

- HTTP failures: 0.00%
- Passed checks: 100.00%

## Threshold evaluation

- APROVADO: p50 < 500 ms - Referência provisória para latência típica.
- APROVADO: p95 < 1000 ms - Referência provisória para controlar a cauda de latência.
- APROVADO: p99 < 2000 ms - Referência provisória para acompanhar respostas muito lentas.
- APROVADO: HTTP failures < 1% - Referência provisória de confiabilidade.
- APROVADO: Checks > 99% - Referência provisória de consistência funcional.

- Passed: 5
- Failed: 0
- Not evaluated: 0
- Overall result: APROVADO

## Sample analysis

- Requests collected: 36
- This short execution is intended for local validation of the test script and target API.
- p95 and p99 are exploratory indicators with this workload and sample size.
- A small sample does not establish statistical stability or system capacity.

## Environment limitations

- Results depend on the target API and its infrastructure.
- Network, DNS, proxy, CDN and geographic distance can affect latency.
- Virtual users do not represent the same number of active human users.
- Throughput depends on response time, pacing and configured workload.
- This local profile does not establish a production SLA or maximum capacity.
- Repeat tests in a controlled environment to establish a representative baseline.

## Threshold assumptions

- p50 below 500 ms: provisional latency target.
- p95 below 1000 ms: provisional latency target.
- p99 below 2000 ms: provisional tail-latency target.
- HTTP failures below 1%: provisional reliability target.
- Checks above 99%: provisional functional target.
- Calibrate these values against business requirements and an agreed SLA/SLO.
- Throughput is observed and has no minimum pass threshold.

## Conclusion

All configured thresholds were met in this local execution. This does not prove production capacity.