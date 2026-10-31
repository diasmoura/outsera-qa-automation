# Outsera QA Automation

Automação de testes Web, API e Performance utilizando JavaScript, Playwright, Cucumber, BDD e K6.

## Sobre o projeto

Este projeto foi desenvolvido como parte de um desafio técnico de QA, com o objetivo de demonstrar estratégias de automação de testes, organização de cenários, validação de funcionalidades e análise de resultados por meio de relatórios consolidados.

A solução contempla testes funcionais Web e API, automação com Playwright, cenários BDD e testes de performance com K6.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| JavaScript / Node.js | Linguagem e ambiente de execução |
| Playwright | Automação de testes Web |
| Cucumber | Automação BDD |
| Gherkin | Escrita dos cenários de teste |
| Express | Mock API |
| K6 | Testes de performance |
| Git / GitHub | Versionamento |
| GitHub Actions | CI/CD |
| HTML / JSON | Relatórios de execução |

## Estrutura do projeto

```text
outsera-qa-automation/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── features/
│   ├── API/
│   └── WEB/
│
├── step-definitions/
│
├── tests/
│
├── reports/
│   ├── bdd/
│   ├── performance/
│   └── consolidated/
│
├── performance/
│
├── dashboard.js
├── cucumber-report.js
├── playwright.config.js
├── package.json
└── README.md
```

## Estratégia de testes

### 1. Testes Web

Automação de fluxos funcionais de interface, incluindo cenários de navegação e interação com funcionalidades do sistema.

### 2. Testes de API

Validação de serviços e respostas de API, utilizando cenários automatizados e massa de dados de teste.

### 3. Testes BDD

Utilização de Gherkin para descrever cenários em linguagem próxima à linguagem de negócio, com execução por meio do Cucumber.

### 4. Testes Playwright

Automação Web com execução em três navegadores:

- Chromium
- Firefox
- WebKit

Geração de relatórios HTML e JSON para análise e integração com o dashboard.

### 5. Testes de Performance

Utilização do K6 para execução de testes de carga e smoke, avaliando volume de requisições, tempo de resposta e falhas HTTP.

## Como executar o projeto

### Pré-requisitos

- Node.js
- NPM
- K6 instalado e configurado no ambiente
- Git

### Instalação

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git

cd outsera-qa-automation

npm install
```

### Executar testes BDD

```bash
npm run test:web
npm run test:api
```

### Executar testes Playwright

```bash
npm run test:playwright
```

### Abrir relatório Playwright

```bash
npm run test:playwright:report
```

### Executar testes de performance

Smoke:

```bash
npm run test:k6:smoke
```

Load:

```bash
npm run test:k6:load
```

## Dashboard de qualidade

O projeto possui um dashboard consolidado que reúne os resultados das execuções automatizadas.

O dashboard apresenta:

- Quantidade de cenários BDD Web e API.
- Total de steps executados.
- Resultados dos testes Playwright.
- Quantidade de testes aprovados e reprovados.
- Taxa de aprovação.
- Métricas de performance do K6.
- Links para os relatórios detalhados.

Para gerar o dashboard:

```bash
npm run dashboard
```

O arquivo HTML é gerado em:

```text
reports/consolidated/index.html
```

Para abrir no Windows:

```powershell
start .\reports\consolidated\index.html
```

**Importante:** execute os testes antes de gerar o dashboard para atualizar os resultados.

## Resultados de execução

Em uma execução validada durante o desenvolvimento do projeto, foram obtidos os seguintes resultados:

| Suíte | Total | Aprovados | Reprovados |
|---|---:|---:|---:|
| BDD Web | 8 | 8 | 0 |
| BDD API | 5 | 5 | 0 |
| Playwright | 24 | 24 | 0 |
| **Total funcional** | **37** | **37** | **0** |

### Performance — K6 Load

Resultados registrados em uma execução anterior:

| Métrica | Resultado |
|---|---:|
| Usuários virtuais máximos | 500 |
| Requisições | 200.871 |
| Requisições por segundo | 371,59 |
| Tempo médio | 1,05 ms |
| Mediana | 1,03 ms |
| p90 | 1,87 ms |
| p95 | 2,32 ms |
| Falhas HTTP | 0% |
| Checks aprovados | 602.613 |
| Checks reprovados | 0 |

Os resultados acima representam execuções realizadas durante o desenvolvimento e não uma garantia de desempenho em qualquer ambiente.

## Diferenciais do projeto

- Automação de testes Web e API.
- Desenvolvimento de cenários BDD com Gherkin.
- Execução cross-browser com Playwright.
- Testes de performance com K6.
- Geração de relatórios HTML e JSON.
- Dashboard consolidado de qualidade.
- Organização de testes e evidências.
- Integração com pipeline CI/CD.

## Autor

**Lucas Dias**

QA Engineer | Software Quality Assurance | Test Automation

GitHub: https://github.com/diasmoura/outsera-qa-automation

---

Projeto desenvolvido para demonstrar conhecimentos em qualidade de software, automação de testes, BDD, performance e integração contínua.