# Performance Test - Load Test

Date: 2026-11-19T03:01:57.599Z
Test URL: http://localhost:3000

## Execution summary

- Total requests: 185
- Throughput: 12.97 req/s
- Maximum VUs: 500
- Duration: 14.27 seconds

## Latency

- Average: 0.74 ms
- Minimum: 0.00 ms
- p50: 0.66 ms
- p90: 1.16 ms
- p95: 1.22 ms
- p99: 2.00 ms
- Maximum: 3.55 ms

## Reliability

- HTTP failures: 0.00%
- Passed checks: 100.00%

## Threshold evaluation

- PASSED: p50 < 500 ms
- PASSED: p95 < 1000 ms
- PASSED: p99 < 2000 ms
- PASSED: HTTP failures < 1%
- PASSED: Checks > 99%

- Passed: 5
- Failed: 0
- Not evaluated: 0
- Overall result: APROVADO

## Sample analysis

- Requests collected: 185
The run has fewer than 10,000 requests. Treat p95 and p99 as exploratory indicators, not stable capacity evidence.

## Environment limitations

- Results depend on the tested API and its infrastructure.
- Network, DNS, proxy, CDN and geographic distance can affect latency.
- Virtual users do not necessarily represent the same number of active human users.
- Throughput depends on response time, pacing and the configured workload.
- This test does not establish a production SLA or maximum system capacity.
- Repeat tests in a controlled environment to establish a baseline.

## Threshold assumptions

- p50 below 500 ms: provisional target.
- p95 below 1000 ms: provisional target.
- p99 below 2000 ms: provisional target.
- HTTP failures below 1%: provisional reliability target.
- Checks above 99%: provisional functional target.
- Calibrate these values against business requirements and an agreed SLA.

## Conclusion

All configured thresholds were met in this execution. Repeat the test before establishing a reliable baseline.

Throughput is reported as an observed metric and has no minimum pass threshold.