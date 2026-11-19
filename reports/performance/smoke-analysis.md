# Relatório de Performance - Smoke Test

Data: 2026-11-19T02:20:21.636Z
URL testada: http://localhost:3000

## 1. Resumo da execução

- Requisições: 5
- Throughput: 1.00 req/s
- VUs máximos: 1
- Duração: 5.02 segundos

## 2. Latência

- Média: 1.06 ms
- Mínima: 0.59 ms
- Mediana (p50): 1.02 ms
- p90: 1.50 ms
- p95: 1.64 ms
- p99: 1.75 ms
- Máxima: 1.77 ms

## 3. Confiabilidade

- Falhas HTTP: 0.00%
- Checks aprovados: 100.00%

## 4. Avaliação dos thresholds

| Critério | Resultado | Status |
|---|---:|---|
| Falhas HTTP abaixo de 1% | 0.00% | APROVADO |
| Checks acima de 99% | 100.00% | APROVADO |
| P95 abaixo de 1000 ms | 1.64 ms | APROVADO |

**Resultado geral: APROVADO**

- Thresholds aprovados: 3
- Thresholds reprovados: 0
- Thresholds sem dados: 0

## 5. Limitações estatísticas

- A execução possui 5 requisições.
- O P95 possui threshold obrigatório de 1000 ms.
- p90 e p99 são indicadores informativos.
- A amostra pequena não comprova capacidade de carga ou SLA.
- O Smoke Test é destinado à verificação rápida de confiabilidade.

## 6. Limitações do ambiente

- Rede, DNS, proxy, CDN e infraestrutura remota podem influenciar a latência.
- O teste utiliza apenas 1 usuário virtual.
- O throughput observado não representa capacidade máxima.
- Repetir os testes em ambiente controlado para construir uma baseline.

## 7. Conclusão

Todos os thresholds obrigatórios foram atendidos nesta execução. O resultado não comprova capacidade de carga.