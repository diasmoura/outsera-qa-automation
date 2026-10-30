# QA Automation — Outsera

Projeto de automação de testes desenvolvido como parte de um desafio técnico de QA, com foco na validação de funcionalidades Web e APIs REST, utilizando boas práticas de automação, organização de código e integração contínua.

## Objetivo

Construir uma estrutura de automação capaz de validar fluxos funcionais de uma aplicação Web e operações de API, garantindo qualidade, confiabilidade e rastreabilidade dos testes por meio de relatórios e evidências.

## Tecnologias utilizadas

- **Node.js** — ambiente de execução.
- **JavaScript** — linguagem de programação.
- **Playwright** — automação Web e testes de API.
- **Cucumber** — escrita e execução de cenários BDD.
- **Gherkin** — especificação dos cenários em linguagem legível.
- **Page Object Model (POM)** — organização e reutilização dos elementos e ações das páginas.
- **Git e GitHub** — versionamento do código.
- **GitHub Actions** — integração e execução contínua (CI).
- **multiple-cucumber-html-reporter** — geração de relatórios de testes.

## Aplicações utilizadas

- **Aplicação Web:** https://automationexercise.com
- **API REST:** https://jsonplaceholder.typicode.com

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
│   │   ├── api-consulta-users.feature
│   │   └── api-users.feature
│   │
│   └── WEB/
│       ├── ecommerce-checkout.feature
│       └── login.feature
│
├── step-definitions/
│   ├── API/
│   │   ├── api-consulta-users.steps.js
│   │   └── api-users.steps.js
│   │
│   └── WEB/
│       ├── checkout.steps.js
│       └── login.steps.js
│
├── pages/
│   └── WEB/
│       ├── AuthPage.js
│       ├── CartCheckoutPage.js
│       ├── HomePage.js
│       └── ProductsPage.js
│
├── tests/
│   └── api.spec.js
│
├── support/
│   └── hooks.js
│
├── reports/
│   └── evidences/
│
├── cucumber.js
├── cucumber-report.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

## Cobertura de testes

### 1. Testes Web — BDD

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

### 2. Testes de API — BDD

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

### 3. Testes de API — Playwright

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

## Integração contínua — GitHub Actions

O projeto possui pipeline automatizada para execução dos testes após alterações no repositório.

**Pipeline:** QA Automation Pipeline

Jobs configurados:

1. **Web BDD Tests:** execução dos cenários Web.
2. **API BDD Tests:** execução dos cenários de API.
3. **Playwright Tests:** execução dos testes automatizados nos navegadores configurados.
4. **Generate Consolidated Report:** consolidação e disponibilização dos relatórios.

**Última execução validada:**

- Pipeline #9.
- Branch: `main`.
- Commit: `d7f43b7`.
- Status: Success.
- 4 de 4 jobs aprovados.

Artefatos gerados:
- `web-results`
- `api-results`
- `playwright-results`
- `qa-automation-final-report`

## Como executar o projeto

### Pré-requisitos

- Node.js instalado.
- NPM instalado.
- Git instalado.
- Navegadores do Playwright configurados.

### 1. Clonar o repositório

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git
```

### 2. Acessar a pasta

```bash
cd outsera-qa-automation
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Instalar os navegadores do Playwright

```bash
npx playwright install
```

### 5. Executar os testes

Para executar os testes BDD:

```bash
npm run test:bdd
```

Para executar os testes Playwright:

```bash
npx playwright test
```

Para executar a rotina consolidada de testes e relatório:

```bash
npm run test:report
```

> Os scripts disponíveis podem ser consultados na seção `scripts` do arquivo `package.json`.

## Relatórios e evidências

O projeto gera relatórios de execução para facilitar a análise dos resultados e a identificação de falhas.

As evidências incluem:
- Relatórios Cucumber.
- Relatórios HTML do Playwright.
- Screenshots dos cenários automatizados.
- Artefatos disponibilizados pela pipeline do GitHub Actions.

Para visualizar o relatório HTML do Playwright:

```bash
npx playwright show-report
```

## Boas práticas aplicadas

- Organização dos cenários utilizando BDD e Gherkin.
- Separação entre funcionalidades, steps e Page Objects.
- Reutilização de métodos e seletores.
- Validação de cenários positivos e negativos.
- Evidências de execução.
- Integração contínua com GitHub Actions.
- Geração de relatórios para acompanhamento dos testes.

## Resultados consolidados

| Tipo de teste | Resultado |
|---|---:|
| Web BDD | 8 cenários aprovados |
| API BDD | 5 cenários aprovados |
| Playwright API | 24 execuções |
| GitHub Actions | 4 jobs aprovados |

**Total de cenários BDD:** 13 aprovados, com 104 steps aprovados nas execuções apresentadas.

## Repositório

GitHub: https://github.com/diasmoura/outsera-qa-automation

---

**Projeto desenvolvido para demonstrar conhecimentos em Qualidade de Software, automação de testes, testes de API, BDD, Playwright, organização de código e integração contínua.**