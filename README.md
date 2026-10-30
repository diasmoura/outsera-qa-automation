# QA Automation — Outsera

Projeto de automação de testes desenvolvido como parte de um desafio técnico de QA, com foco na validação de funcionalidades Web, APIs REST e testes de performance, utilizando boas práticas de automação, organização de código e integração contínua.

## 1. Objetivo

Construir uma estrutura de automação capaz de validar fluxos funcionais de uma aplicação Web e operações de API, garantindo qualidade, confiabilidade e rastreabilidade dos testes por meio de relatórios e evidências.

## 2. Tecnologias utilizadas

- **Node.js:** ambiente de execução.
- **JavaScript:** linguagem de programação.
- **Playwright:** automação Web e testes de API.
- **Cucumber:** escrita e execução de cenários BDD.
- **Gherkin:** especificação dos cenários em linguagem legível.
- **Page Object Model (POM):** organização e reutilização de elementos e ações das páginas.
- **K6:** execução de testes de performance, smoke e carga.
- **Git e GitHub:** versionamento do código.
- **GitHub Actions:** integração e execução contínua (CI).
- **multiple-cucumber-html-reporter:** geração de relatórios de testes.

## 3. Aplicações utilizadas

- **Aplicação Web:** https://automationexercise.com
- **API REST para testes funcionais:** https://jsonplaceholder.typicode.com
- **API local para testes de performance:** aplicação mock desenvolvida com Node.js e Express.

## 4. Estrutura do projeto

```text
outsera-qa-automation/
│
├── .github/
│   └── workflows/
│       └── ci.yml
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
│   └── performance/
│       ├── smoke-summary.json
│       ├── load-summary.json
│       └── load-report.html
│
├── cucumber.js
├── cucumber-report.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

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

Validações realizadas:
- Status code HTTP.
- Header Content-Type.
- Estrutura e conteúdo do JSON.
- Dados retornados pela API.

**Resultado:** 5 cenários aprovados e 36 steps aprovados.

> Observação: o JSONPlaceholder é uma API de testes. As operações POST, PUT e DELETE simulam as respostas, sem persistir efetivamente as alterações.

### 5.3. Testes de API — Playwright

Execução de testes automatizados utilizando Playwright, com cobertura nos navegadores Chromium, Firefox e WebKit.

Casos contemplados:
- GET de usuário existente.
- GET de usuário inexistente.
- POST para criação de usuário.
- POST sem campos obrigatórios.
- POST com payload malformado.
- PUT para atualização de usuário.
- DELETE de usuário.
- Validação de método HTTP inválido.

**Cobertura:** 8 testes executados em 3 engines, totalizando 24 execuções de testes.

### 5.4. Testes de Performance — K6

Foi implementada uma estrutura de testes de performance utilizando K6 para avaliar o comportamento de uma API sob carga.

**Smoke Test**
- 1 usuário virtual.
- 5 iterações.
- Validação de status HTTP 200.
- Verificação de resposta não vazia.
- Validação do Content-Type JSON.

**Teste de Carga**
- Ramp-up para 100 usuários virtuais em 1 minuto.
- Ramp-up para 250 usuários virtuais em 1 minuto.
- Ramp-up para 500 usuários virtuais em 1 minuto.
- Sustentação de 500 usuários virtuais durante 5 minutos.
- Ramp-down para zero usuários em 1 minuto.

**Resultados registrados**

| Métrica | Resultado |
|---|---:|
| Usuários virtuais máximos | 500 |
| Total de requisições | 131.548 |
| Requisições por segundo | 157,01 |
| Tempo médio | 0,95 ms |
| Percentil 95 (p95) | 1,85 ms |
| Tempo máximo | 28,49 ms |
| Falhas HTTP | 0% |
| Checks aprovados | 394.644 |
| Checks reprovados | 0 |

**Thresholds configurados**
- Taxa de falhas HTTP inferior a 1%.
- Percentil 95 inferior a 1.000 ms.
- Taxa de checks superior a 99%.

**Análise dos resultados**

O teste apresentou 0% de falhas HTTP e 100% de checks aprovados. O percentil 95 foi de 1,85 ms, permanecendo abaixo do limite configurado de 1.000 ms.

**Limitação do ambiente:** o teste foi executado localmente, com a API e o K6 na mesma máquina. Portanto, os resultados não representam uma medição isolada da capacidade de uma infraestrutura de produção. Recomenda-se repetir o teste em infraestrutura separada e autorizada para uma análise mais representativa de possíveis gargalos.

## 6. Integração contínua — GitHub Actions

O projeto possui pipeline automatizada para execução dos testes após alterações no repositório.

**Pipeline:** QA Automation Pipeline.

Jobs configurados:

1. **Web BDD Tests:** execução dos cenários Web.
2. **API BDD Tests:** execução dos cenários de API.
3. **Playwright Tests:** execução dos testes automatizados nos navegadores configurados.
4. **Generate Consolidated Report:** consolidação e disponibilização dos relatórios.

**Última execução validada:**
- Pipeline #9.
- Branch: `main`.
- Commit informado: `d7f43b7`.
- Status: Success.
- 4 de 4 jobs aprovados.

Artefatos gerados:
- `web-results`
- `api-results`
- `playwright-results`
- `qa-automation-final-report`

> Os testes de performance foram executados localmente. A integração do K6 ao GitHub Actions ainda não está incluída nesta execução validada da pipeline.

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

### 7.4. Instalar os navegadores do Playwright

```bash
npx playwright install
```

### 7.5. Executar os testes

**Testes BDD:**

```bash
npm run test:bdd
```

**Testes Playwright:**

```bash
npx playwright test
```

**Rotina consolidada de testes e relatório:**

```bash
npm run test:report
```

**Performance — Smoke Test:**

```bash
npm run test:performance:smoke
```

**Performance — Teste de Carga:**

```bash
npm run test:performance:load
```

Para executar os testes de performance, configure a variável `BASE_URL` para apontar para uma API autorizada.

No ambiente Windows utilizado no desenvolvimento, o arquivo `performance/run-k6.js` utiliza o caminho local de instalação do K6. Em outros ambientes, esse caminho deve ser adaptado.

## 8. Relatórios e evidências

O projeto gera relatórios de execução para facilitar a análise dos resultados e a identificação de falhas.

As evidências incluem:
- Relatórios Cucumber.
- Relatórios HTML do Playwright.
- Screenshots dos cenários automatizados.
- Relatórios JSON do K6.
- Relatórios HTML de performance.
- Artefatos disponibilizados pela pipeline do GitHub Actions.

Para visualizar o relatório HTML do Playwright:

```bash
npx playwright show-report
```

Relatórios de performance:
- `reports/performance/smoke-summary.json`
- `reports/performance/load-summary.json`
- `reports/performance/load-report.html`

## 9. Boas práticas aplicadas

- Organização dos cenários utilizando BDD e Gherkin.
- Separação entre funcionalidades, steps e Page Objects.
- Reutilização de métodos e seletores.
- Validação de cenários positivos e negativos.
- Utilização de métricas e thresholds de performance.
- Geração de evidências e relatórios.
- Integração contínua com GitHub Actions.
- Organização e rastreabilidade dos testes.

## 10. Resultados consolidados

| Tipo de teste | Resultado |
|---|---:|
| Web BDD | 8 cenários aprovados |
| API BDD | 5 cenários aprovados |
| Playwright API | 24 execuções |
| Performance K6 | Até 500 VUs |
| GitHub Actions | 4 jobs aprovados |

**Total de cenários BDD:** 13 aprovados, com 104 steps aprovados nas execuções apresentadas.

## 11. Repositório

GitHub: https://github.com/diasmoura/outsera-qa-automation

---

**Projeto desenvolvido para demonstrar conhecimentos em Qualidade de Software, automação de testes, testes de API, BDD, Playwright, performance, organização de código e integração contínua.**