# 🚀 Outsera QA Automation

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Playwright](https://img.shields.io/badge/Playwright-Automation-green)
![Cucumber](https://img.shields.io/badge/Cucumber-BDD-brightgreen)
![BDD Tests](https://img.shields.io/badge/BDD-13%20Passed-success)
![CI](https://img.shields.io/badge/GitHub%20Actions-Success-brightgreen)

Projeto de automação de testes Web e API desenvolvido como parte de um desafio técnico de QA Automation, utilizando JavaScript, Playwright e Cucumber.

A solução valida funcionalidades Web e serviços REST por meio de cenários automatizados, aplicando boas práticas de desenvolvimento, reutilização de código, organização dos testes e integração contínua.

## 🎯 Objetivo

Desenvolver uma estrutura de automação capaz de validar funcionalidades Web e serviços REST, contemplando cenários positivos e negativos, execução cross-browser e integração contínua.

## 🛠️ Tecnologias utilizadas

- JavaScript / Node.js
- Playwright
- Cucumber
- Gherkin (BDD)
- Page Object Model (POM)
- Dotenv
- NPM
- Git e GitHub
- GitHub Actions

## 📁 Estrutura do projeto

```text
outsera-qa-automation/
├── .github/
│   └── workflows/
│       └── ci.yml
├── features/
│   ├── WEB/
│   │   ├── login.feature
│   │   └── ecommerce-checkout.feature
│   └── API/
│       ├── api-users.feature
│       └── api-consulta-users.feature
├── pages/
│   └── WEB/
│       ├── HomePage.js
│       ├── AuthPage.js
│       ├── ProductsPage.js
│       └── CartCheckoutPage.js
├── step-definitions/
│   ├── WEB/
│   └── API/
├── support/
│   └── hooks.js
├── tests/
├── reports/
│   └── evidences/
├── cucumber-report.js
├── playwright.config.js
├── cucumber.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

*Estrutura resumida. Consulte o repositório para visualizar todos os arquivos.*

## 🧪 Cobertura dos testes

### Testes Web — Cucumber / BDD

- Login com credenciais válidas.
- Login com senha incorreta.
- Login com usuário inexistente.
- Validação de campos obrigatórios.
- Inclusão de produtos no carrinho.
- Validação de carrinho vazio.
- Acesso ao checkout.
- Validação do endereço de entrega.
- Finalização de compra.

### Testes de API

- GET: consulta de usuário existente.
- GET: consulta de usuário inexistente.
- GET: validação de rota inexistente.
- POST: criação de usuário.
- POST: validação de campos obrigatórios.
- POST: validação de payload malformado.
- PUT: atualização de usuário.
- DELETE: exclusão de usuário.
- Validação de método HTTP inválido.

**Observação:** os testes utilizam a API JSONPlaceholder, um serviço de demonstração. As operações de criação, atualização e exclusão simulam respostas HTTP, sem persistir efetivamente as alterações.

### Limitações identificadas no Checkout

Durante a implementação dos testes E2E, foram identificadas limitações no ambiente Automation Exercise:

- **Cartão inválido:** não foi possível implementar uma validação negativa confiável de rejeição do cartão.
- **Endereço incompleto:** o checkout utiliza o endereço previamente cadastrado na conta, não oferecendo um fluxo adequado para validar essa condição.

Esses cenários foram documentados como limitações do ambiente, evitando validações artificiais.

## 🌐 Execução Cross-browser

A configuração do Playwright contempla três motores de navegador:

- **Chromium:** navegador baseado em Chromium.
- **Firefox:** navegador Firefox.
- **WebKit:** motor utilizado pelo Safari.

O arquivo `playwright.config.js` também contempla:

- Execução paralela dos testes.
- Duas tentativas adicionais em caso de falha no CI.
- Um worker durante a execução no CI.
- Geração de relatório HTML.
- Captura de trace na primeira repetição.

## 📊 Resultados da execução

### Execução local BDD — 30/10/2026

| Suíte | Cenários aprovados | Falhas |
|---|---:|---:|
| BDD Web — Cucumber | 8 | 0 |
| BDD API — Cucumber | 5 | 0 |
| **Total BDD** | **13** | **0** |

**Taxa de aprovação BDD: 100%.**

Os resultados acima correspondem à execução local registrada em 30/10/2026.

### Integração contínua

A execução #6 do GitHub Actions, commit `e36b7cb`, na branch `main`, terminou com sucesso.

Jobs concluídos:

- Web BDD Tests.
- API BDD Tests.
- Playwright Tests.
- Generate Consolidated Report.

Os resultados detalhados e os relatórios podem ser consultados nos artefatos da execução no GitHub Actions.

A quantidade individual de testes Playwright não é apresentada nesta tabela porque o total da execução #6 ainda não foi detalhado nesta documentação.

## ⚙️ Instalação

### Pré-requisitos

- Node.js
- NPM
- Git

### Clonar o repositório

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git
```

Acessar a pasta:

```bash
cd outsera-qa-automation
```

Instalar as dependências:

```bash
npm install
```

Instalar os navegadores do Playwright:

```bash
npx playwright install
```

## 🔐 Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
QA_LOGIN_EMAIL=seu_email
QA_LOGIN_PASSWORD=sua_senha

QA_CARD_NAME=Nome do titular
QA_CARD_NUMBER=Numero do cartao
QA_CARD_CVC=CVC
QA_CARD_EXPIRY_MONTH=12
QA_CARD_EXPIRY_YEAR=2028
```

Utilize somente dados de teste.

**Importante:** não compartilhe credenciais reais no GitHub. O arquivo `.env` deve estar incluído no `.gitignore`. O arquivo `.env.example` pode conter apenas valores fictícios ou campos de exemplo.

## ▶️ Execução dos testes

Executar testes Web:

```bash
npm run test:web
```

Executar testes de API:

```bash
npm run test:api
```

Executar testes Playwright:

```bash
npm run test:playwright
```

Executar toda a suíte:

```bash
npm run test:all
```

Executar testes Web e API e gerar o relatório HTML consolidado:

```bash
npm run test:report
```

Executar toda a suíte e gerar o relatório Cucumber:

```bash
npm run test:all:report
```

Gerar novamente o relatório Cucumber:

```bash
npm run report
```

## 📄 Relatórios e evidências

O projeto gera relatórios separados para as suítes de automação:

**Cucumber — Web e API**

O relatório HTML consolidado é gerado em:

```text
reports/html/index.html
```

**Playwright**

Para visualizar o relatório HTML do Playwright:

```bash
npx playwright show-report
```

O relatório Playwright é disponibilizado separadamente do relatório consolidado Cucumber.

O projeto também contempla captura automática de screenshots em caso de falhas nos cenários Web.

Os relatórios e evidências são disponibilizados como artefatos nas execuções do GitHub Actions, conforme a configuração do pipeline.

## 🔄 Integração contínua — CI/CD

O projeto utiliza GitHub Actions para automatizar a execução dos testes após alterações no repositório.

O pipeline contempla:

- Execução dos testes BDD Web.
- Execução dos testes BDD API.
- Execução dos testes Playwright.
- Geração do relatório consolidado Cucumber.
- Disponibilização de relatórios e evidências como artefatos.

A pipeline também permite acompanhar o resultado de cada etapa diretamente pelo GitHub Actions.

## ⭐ Diferenciais técnicos

- Automação de testes Web e API.
- Arquitetura Page Object Model.
- Desenvolvimento de cenários BDD com Gherkin.
- Execução cross-browser.
- Cobertura de cenários positivos e negativos.
- Reutilização de componentes e steps.
- Gerenciamento de credenciais por variáveis de ambiente.
- Captura automática de evidências.
- Scripts NPM para execução dos testes.
- Integração contínua com GitHub Actions.
- Geração de relatórios HTML.

## 👨‍💻 Considerações finais

Este projeto demonstra conhecimentos práticos em QA Automation, incluindo automação de testes Web e API, estruturação de cenários BDD, aplicação de boas práticas de desenvolvimento, validação funcional, execução cross-browser e integração contínua.

**Desenvolvido como parte de um desafio técnico de QA Automation.**