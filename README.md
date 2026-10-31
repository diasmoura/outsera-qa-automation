# QA Automation — Outsera

Projeto de automação de testes desenvolvido como parte de um desafio técnico de QA, com foco na validação de funcionalidades Web, APIs REST e testes de performance, utilizando boas práticas de automação, organização de código e integração contínua.

## 1. Objetivo

Construir uma estrutura de automação capaz de validar fluxos funcionais de uma aplicação Web e operações de API, garantindo qualidade, confiabilidade e rastreabilidade dos testes por meio de relatórios, evidências e execução automatizada em pipeline CI/CD.

## 2. Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| Node.js | Ambiente de execução |
| JavaScript | Linguagem de programação |
| Playwright | Automação Web e testes de API |
| Cucumber | Escrita e execução de cenários BDD |
| Gherkin | Especificação dos cenários |
| Page Object Model (POM) | Organização e reutilização de páginas e ações |
| K6 | Testes de performance, smoke e carga |
| Express | Desenvolvimento da API mock para performance |
| Git e GitHub | Versionamento do código |
| GitHub Actions | Integração e execução contínua |
| multiple-cucumber-html-reporter | Geração de relatórios HTML |

## 3. Aplicações utilizadas

- **Aplicação Web:** https://automationexercise.com
- **API REST para testes funcionais:** https://jsonplaceholder.typicode.com
- **API mock para testes de performance:** aplicação desenvolvida com Node.js e Express.

## 4. Estrutura do projeto

```text
outsera-qa-automation/
│
├── .github/
│   └── workflows/
│       └── qa-automation.yml
│
├── features/
│   ├── API/
│   │   ├── api-consulta-users.feature
│   │   └── api-users.feature
│   │
│   └── WEB/
│       ├── ecommerce-checkout.feature
│       └── login.feature
│
├── step-definitions/
│   ├── API/
│   └── WEB/
│
├── pages/
│   └── WEB/
│
├── tests/
│   └── api.spec.js
│
├── support/
│   └── hooks.js
│
├── performance/
│   ├── server.js
│   ├── smoke-test.js
│   ├── load-test.js
│   ├── run-k6.js
│   ├── report.js
│   └── load-report.js
│
├── reports/
│   ├── evidences/
│   ├── consolidated/
│   └── performance/
│
├── dashboard.js
├── cucumber.js
├── cucumber-report.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

*Estrutura resumida dos principais diretórios e arquivos do projeto.*

## 5. Cobertura de testes

### 5.1. Testes Web — BDD

Automação dos principais fluxos da aplicação Automation Exercise.

**Login — 4 cenários**

- Realizar login com credenciais válidas.
- Realizar login com senha incorreta.
- Realizar login com usuário inexistente.
- Tentar login com campos obrigatórios em branco.

**Carrinho e Checkout — 4 cenários**

- Adicionar produto ao carrinho.
- Realizar compra completa com dados válidos.
- Validar endereço de entrega exibido no checkout.
- Tentar acessar checkout com carrinho vazio.

**Resultado:** 8 cenários aprovados e 68 steps aprovados.

### 5.2. Testes de API — BDD

Validação dos principais métodos HTTP utilizando JSONPlaceholder.

**Consulta de usuários**

- Consultar usuário existente — HTTP 200.
- Consultar usuário inexistente — HTTP 404.

**Gerenciamento de usuários**

- Criar usuário com dados válidos — HTTP 201.
- Atualizar usuário existente — HTTP 200.
- Excluir usuário existente — HTTP 200.

**Validações realizadas**

- Status code HTTP.
- Header Content-Type.
- Estrutura e conteúdo do JSON.
- Dados retornados pela API.

**Resultado:** 5 cenários aprovados e 36 steps aprovados.

> Observação: o JSONPlaceholder é uma API de testes. As operações POST, PUT e DELETE simulam as respostas, sem persistir efetivamente as alterações.

### 5.3. Testes de API — Playwright

Execução de testes automatizados utilizando Playwright, com cobertura nos navegadores Chromium, Firefox e WebKit.

**Casos contemplados**

- GET de usuário existente.
- GET de usuário inexistente.
- POST para criação de usuário.
- POST sem campos obrigatórios.
- POST com payload malformado.
- PUT para atualização de usuário.
- DELETE de usuário.
- Validação de método HTTP inválido.

**Cobertura:** 8 casos de teste executados em 3 engines, totalizando 24 execuções.

**Resultado da última execução local:** 24 testes aprovados, sem falhas.

### 5.4. Testes de Performance — K6

Foi implementada uma estrutura de testes de performance utilizando K6 para avaliar o comportamento de uma API mock sob diferentes níveis de carga.

**Smoke Test**

- 1 usuário virtual.
- 5 iterações.
- Validação de status HTTP 200.
- Verificação de resposta não vazia.
- Validação do Content-Type JSON.

**Teste de Carga**

Configuração de estágios:

- Ramp-up para 100 usuários virtuais em 1 minuto.
- Ramp-up para 250 usuários virtuais em 1 minuto.
- Ramp-up para 500 usuários virtuais em 1 minuto.
- Sustentação de 500 usuários virtuais durante 5 minutos.
- Ramp-down para zero usuários em 1 minuto.

#### Resultados apresentados no Dashboard

| Métrica | Resultado |
|---|---:|
| Usuários virtuais máximos | 500 |
| Total de requisições | 200.871 |
| Requisições por segundo | 371,59 |
| Tempo médio | 1,05 ms |
| Mediana | 1,03 ms |
| Percentil 90 (p90) | 1,87 ms |
| Percentil 95 (p95) | 2,32 ms |
| Falhas HTTP | 0,00% |
| Checks aprovados | 602.613 |
| Checks reprovados | 0 |

#### Thresholds configurados

- Taxa de falhas HTTP inferior a 1%.
- Percentil 95 inferior a 1.000 ms.
- Taxa de checks superior a 99%.

**Resultado:** todos os thresholds apresentados no relatório foram atendidos.

#### Análise dos resultados

O teste registrou 500 usuários virtuais máximos e 200.871 requisições, alcançando uma vazão de 371,59 requisições por segundo.

O tempo médio de resposta foi de 1,05 ms, enquanto o percentil 95 (p95) foi de 2,32 ms. A taxa de falhas HTTP foi de 0,00%, e os 602.613 checks executados foram aprovados.

Os resultados demonstram desempenho positivo da API mock no ambiente avaliado, com baixa latência e atendimento aos thresholds configurados.

**Limitação do ambiente:** os resultados representam uma validação técnica da API mock no ambiente de teste e não devem ser interpretados como benchmark de produção.

> Observação: a duração média da iteração pode incluir o `sleep(1)` configurado no script K6. Portanto, não representa exclusivamente o tempo de resposta da API.

## 6. Integração contínua — GitHub Actions

O projeto possui pipeline automatizada para execução dos testes e geração de relatórios após alterações no repositório.

**Nome da pipeline:** QA Automation - CI/CD Pipeline.

**Gatilhos de execução:**

- Push na branch `main`.
- Pull Request direcionado à branch `main`.
- Execução manual pelo GitHub Actions.

### Jobs configurados

1. **Web BDD Tests:** execução dos cenários automatizados Web.
2. **API BDD Tests:** execução dos cenários automatizados de API.
3. **Playwright Tests:** execução dos testes automatizados utilizando Playwright.
4. **Performance Tests (K6):** execução dos testes de carga e geração dos resultados de performance.
5. **Generate Consolidated Report:** consolidação dos resultados e geração do Dashboard de Qualidade.

### Dashboard de Qualidade

O projeto conta com um Dashboard para centralizar os resultados das execuções automatizadas.

**Informações apresentadas:**

- Resultados dos testes BDD Web e API.
- Status das execuções Playwright.
- Métricas dos testes de performance K6.
- Validação dos thresholds de performance.
- Links para acesso aos relatórios HTML e JSON.
- Indicadores de aprovação e reprovação.

O Dashboard é gerado pelo arquivo `dashboard.js` e integrado ao job de consolidação do GitHub Actions.

**Artefato final:** `qa-automation-final-report`.

Os relatórios e evidências podem ser baixados na página da execução do workflow.

### Histórico da última execução validada

- Pipeline: #17.
- Branch: `main`.
- Commit: `5f6357b`.
- Status: **Success**.
- Duração: aproximadamente 9 minutos e 41 segundos.
- Artefatos gerados: 5.

**Artefatos disponibilizados:**

- `web-results`
- `api-results`
- `playwright-results`
- `performance-results`
- `qa-automation-final-report`

## 7. Como executar o projeto

### Pré-requisitos

- Node.js instalado.
- NPM instalado.
- Git instalado.
- Navegadores do Playwright configurados.
- K6 instalado para executar os testes de performance.

### 7.1. Clonar o repositório

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git
```

### 7.2. Acessar a pasta

```bash
cd outsera-qa-automation
```

### 7.3. Instalar as dependências

```bash
npm install
```

No Windows PowerShell, caso a política de execução bloqueie `npm.ps1`, utilize `npm.cmd`:

```powershell
npm.cmd install
```

### 7.4. Instalar os navegadores do Playwright

```bash
npx playwright install
```

### 7.5. Executar os testes

**Testes BDD completos:**

```bash
npm run test:bdd
```

**Testes Web:**

```bash
npm run test:web
```

**Testes de API BDD:**

```bash
npm run test:api
```

**Testes Playwright:**

```bash
npm run test:playwright
```

**Teste de performance Smoke:**

```bash
npm run test:k6:smoke
```

**Teste de carga K6:**

```bash
npm run test:k6:load
```

**Gerar relatório Cucumber:**

```bash
npm run report
```

**Gerar Dashboard:**

```bash
npm run dashboard
```

**Executar testes funcionais e gerar os relatórios:**

```bash
npm run test:all:report
```

Esse comando executa os testes Web, API BDD e Playwright, gera o relatório Cucumber e atualiza o Dashboard. Os testes K6 são executados separadamente.

### 7.6. Visualizar o Dashboard

No Windows PowerShell:

```powershell
start .\reports\consolidated\index.html
```

### 7.7. Visualizar o relatório Playwright

```bash
npx playwright show-report
```

## 8. Relatórios e evidências

O projeto gera relatórios de execução para facilitar a análise dos resultados e a identificação de falhas.

**Evidências e relatórios disponíveis:**

- Relatórios Cucumber.
- Relatórios HTML do Playwright.
- Screenshots dos cenários automatizados.
- Relatórios JSON do K6.
- Relatórios HTML de performance.
- Relatórios consolidados.
- Dashboard de Qualidade.
- Artefatos disponibilizados pela pipeline do GitHub Actions.

**Principais arquivos de performance:**

- `reports/performance/smoke-summary.json`
- `reports/performance/load-summary.json`
- `reports/performance/load-report.html`

O Dashboard consolidado é gerado por:

```bash
node dashboard.js
```

> Observação: a geração local do Dashboard depende da existência dos relatórios de entrada esperados pelo arquivo `dashboard.js`.

## 9. Boas práticas aplicadas

- Organização dos cenários utilizando BDD e Gherkin.
- Separação entre funcionalidades, steps e Page Objects.
- Reutilização de métodos e seletores.
- Validação de cenários positivos e negativos.
- Validação de status HTTP, headers e conteúdo das respostas.
- Utilização de métricas e thresholds de performance.
- Geração de evidências e relatórios.
- Integração contínua com GitHub Actions.
- Organização e rastreabilidade dos testes.
- Versionamento do código utilizando Git e GitHub.

## 10. Resultados consolidados

| Tipo de teste | Resultado |
|---|---:|
| Web BDD | 8 cenários aprovados |
| API BDD | 5 cenários aprovados |
| Playwright API | 24 testes aprovados |
| Performance K6 | Até 500 usuários virtuais |
| GitHub Actions | Pipeline #17 com status Success |

**Resultado da última execução local dos testes funcionais:**

- 13 cenários BDD aprovados.
- 104 steps BDD aprovados.
- 24 testes Playwright aprovados.
- 0 falhas nos resultados apresentados.

**Total: 37 cenários/testes aprovados**, considerando 13 cenários BDD e 24 testes Playwright.

Os testes de performance K6 possuem execução e métricas próprias, não sendo somados ao total de testes funcionais.

## 11. Repositório

**GitHub:** https://github.com/diasmoura/outsera-qa-automation

---

**Projeto desenvolvido para demonstrar conhecimentos em Qualidade de Software, automação de testes, testes de API, BDD, Playwright, performance, organização de código, geração de relatórios e integração contínua.**