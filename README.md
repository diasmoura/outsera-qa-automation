# 🚀 Outsera QA Automation

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Playwright](https://img.shields.io/badge/Playwright-Automation-green)
![Cucumber](https://img.shields.io/badge/Cucumber-BDD-brightgreen)
![Tests](https://img.shields.io/badge/Tests-37%20Passed-success)

Projeto de automação de testes Web e API desenvolvido como parte de um desafio técnico de QA Automation, utilizando JavaScript, Playwright e Cucumber.

A solução tem como objetivo validar funcionalidades e serviços REST por meio de cenários automatizados, aplicando boas práticas de desenvolvimento, reutilização de código e organização dos testes.

## 🎯 Objetivo

Desenvolver uma estrutura de automação capaz de validar funcionalidades Web e serviços REST, contemplando cenários positivos e negativos, além de execução cross-browser e integração contínua.

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
│
├── features/
│   ├── WEB/
│   │   ├── login.feature
│   │   └── ecommerce-checkout.feature
│   │
│   └── API/
│       ├── api-users.feature
│       └── api-consulta-users.feature
│
├── pages/
│   └── WEB/
│       ├── HomePage.js
│       ├── AuthPage.js
│       ├── ProductsPage.js
│       └── CartCheckoutPage.js
│
├── step-definitions/
│   ├── WEB/
│   └── API/
│
├── support/
│   └── hooks.js
│
├── tests/
│   └── api.spec.js
│
├── reports/
│   └── evidences/
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

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
- POST: criação de usuário.
- POST: validação de campos obrigatórios.
- POST: validação de payload malformado.
- PUT: atualização de usuário.
- DELETE: exclusão de usuário.
- Validação de método HTTP inválido.

**Observação:** os testes utilizam a API JSONPlaceholder, que é um serviço de demonstração. As operações de criação, atualização e exclusão simulam as respostas HTTP, sem persistir efetivamente as alterações.

### Limitações identificadas no Checkout

Durante a implementação dos testes E2E, foram identificadas limitações no ambiente Automation Exercise:

- **Cartão inválido:** não foi possível implementar uma validação negativa confiável de rejeição do cartão.
- **Endereço incompleto:** o checkout utiliza o endereço previamente cadastrado na conta, não oferecendo um fluxo adequado para validar essa condição.

Esses cenários foram documentados como não implementados, evitando validações artificiais ou resultados que não representem o comportamento real da aplicação.

## 🌐 Execução Cross-browser

Os testes Playwright contemplam os seguintes navegadores:

- Chromium
- Firefox
- WebKit

Essa abordagem amplia a cobertura de compatibilidade e permite identificar possíveis diferenças de comportamento entre navegadores.

## 📊 Resultados da execução

Resultados registrados em 29/10/2026:

| Suíte | Resultado |
|---|---:|
| BDD Web — Cucumber | 8/8 aprovados |
| BDD API — Cucumber | 5/5 aprovados |
| Playwright Cross-browser | 24/24 aprovados |
| **Total** | **37/37 aprovados** |

**Taxa de aprovação: 100% na execução registrada.**

Os resultados representam a execução registrada dos testes, não uma garantia de ausência de defeitos na aplicação.

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

**Importante:** não compartilhe credenciais reais no GitHub. O arquivo `.env` deve estar incluído no `.gitignore`.

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

## 🔄 Integração contínua — CI/CD

O projeto utiliza GitHub Actions para automatizar a execução dos testes após alterações no repositório.

O pipeline contempla etapas de:

- Execução dos testes BDD.
- Execução dos testes Web.
- Execução dos testes de API.
- Execução dos testes Playwright.
- Geração e disponibilização de relatórios e evidências como artefatos.

## 📸 Evidências e relatórios

O projeto contempla captura automática de screenshots em caso de falhas nos cenários Web, facilitando a análise e a rastreabilidade dos resultados.

Para visualizar o relatório HTML do Playwright:

```bash
npx playwright show-report
```

Os relatórios e evidências são armazenados na pasta `reports/` e disponibilizados como artefatos nas execuções do GitHub Actions, conforme configuração do pipeline.

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

## 👨‍💻 Considerações finais

Este projeto demonstra conhecimentos práticos em QA Automation, incluindo automação de testes Web e API, estruturação de cenários BDD, aplicação de boas práticas de desenvolvimento, validação funcional, execução cross-browser e integração contínua.

**Desenvolvido como parte de um desafio técnico de QA Automation.**