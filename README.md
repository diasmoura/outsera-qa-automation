# Outsera QA Automation

Projeto de automação de testes de API e aplicações Web, desenvolvido em JavaScript com Playwright e Cucumber.js, utilizando cenários BDD, validações automatizadas, relatórios e integração contínua.

## Objetivo

Validar funcionalidades de APIs REST e fluxos Web, incluindo cenários positivos e negativos, com evidências e relatórios para apoiar a análise dos resultados.

## Tecnologias

- **Node.js 24** — ambiente de execução JavaScript.
- **Cucumber.js 13** — especificação e execução de cenários BDD.
- **Playwright 1.64** — automação Web e testes de API.
- **JSONPlaceholder** — API pública de demonstração para operações com usuários.
- **GitHub Actions** — integração contínua.
- **multiple-cucumber-html-reporter** — geração de relatório HTML do Cucumber.

As versões acima devem ser conferidas com o `package.json` e o ambiente utilizado na execução.

## Arquitetura do projeto

```text
outsera-qa-automation/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── features/
│   ├── ecommerce-checkout.feature
│   ├── ecommerce-login.feature
│   ├── usuarios-crud.feature
│   └── usuarios.feature
├── pages/
│   ├── HomePage.js
│   ├── AuthPage.js
│   ├── ProductsPage.js
│   └── CartCheckoutPage.js
├── step-definitions/
├── tests/
│   └── api.spec.js
├── reports/
├── playwright-report/
├── test-results/
├── cucumber-report.js
├── package.json
└── README.md
```

## Pré-requisitos

- Node.js e npm instalados.
- Git instalado para versionamento.
- Acesso à internet para executar os testes contra os serviços públicos utilizados.

## Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git
cd outsera-qa-automation
```

Instale as dependências:

```bash
npm ci
```

Instale os navegadores do Playwright:

```bash
npx playwright install
```

No Linux ou no ambiente de CI, pode ser necessário instalar também as dependências do sistema:

```bash
npx playwright install --with-deps
```

## Executar os testes

### Testes BDD com Cucumber

```bash
npm run test:bdd
```

### Gerar relatório HTML do Cucumber

```bash
npm run test:report
```

O relatório é gerado em `reports/html/`, conforme a configuração do projeto.

### Testes de API

```bash
npx playwright test tests/api.spec.js
```

### Testes Web

```bash
npm run test:web
```

### Testes completos

```bash
npm run test:all
```

## Relatórios e evidências

- **Cucumber:** `reports/cucumber-report.json`
- **Relatório HTML do Cucumber:** `reports/html/`
- **Relatório HTML do Playwright:** `playwright-report/`
- **Resultados e evidências de execução:** `test-results/` e `reports/evidences/`, conforme os testes e as configurações executados.

Para abrir o relatório HTML do Playwright:

```bash
npx playwright show-report
```

## Integração contínua — GitHub Actions

O workflow localizado em `.github/workflows/playwright.yml` está configurado para ser acionado por `push` e `pull_request` nas branches `main` e `master`.

A pipeline executa os testes BDD e Playwright e tenta publicar os relatórios como artefatos da execução.

O funcionamento efetivo deve ser confirmado pela execução do workflow no GitHub Actions.

## Resultados da última execução local informada

- **BDD:** 7 cenários aprovados e 51 passos aprovados.
- **Playwright:** 24 testes aprovados.
- **Falhas:** nenhuma nas execuções informadas.

Os resultados podem variar conforme a disponibilidade e o comportamento dos serviços externos.

## Limitações conhecidas

O JSONPlaceholder é uma API pública de demonstração. As operações de criação, atualização e exclusão simulam respostas e não garantem persistência real dos dados.

Os testes Web dependem da disponibilidade e do comportamento do site externo utilizado. Os testes negativos devem considerar as validações que o serviço realmente oferece.

## Boas práticas

- Organização de cenários BDD por funcionalidade.
- Separação entre especificações, steps, Page Objects e testes.
- Asserções explícitas de status HTTP e conteúdo das respostas.
- Geração de relatórios e evidências.
- Execução automatizada em integração contínua.
