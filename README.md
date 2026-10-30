# Outsera QA Automation

Projeto de automação de testes desenvolvido como parte de um desafio técnico de QA, com foco na validação de funcionalidades Web, API e testes automatizados utilizando BDD e Playwright.

O projeto contempla cenários positivos e negativos, validações funcionais, evidências de execução e integração contínua com GitHub Actions.

## Tecnologias utilizadas

- **JavaScript / Node.js**
- **Playwright** – automação e testes Web
- **Cucumber** – BDD (Behavior Driven Development)
- **Gherkin** – especificação dos cenários de teste
- **APIs REST** – testes e validações de serviços
- **Git e GitHub** – versionamento de código
- **GitHub Actions** – integração e execução contínua
- **Multiple Cucumber HTML Reporter** – geração de relatórios HTML
- **Dotenv** – gerenciamento de variáveis de ambiente

## Escopo dos testes

### 1. Testes Web

Automação de funcionalidades do site [Automation Exercise](https://automationexercise.com/).

Cenários contemplados:

- Acesso à página inicial.
- Login com credenciais válidas.
- Login com senha incorreta.
- Login com usuário inexistente.
- Validação de campos obrigatórios.
- Consulta e listagem de produtos.
- Adição de produtos ao carrinho.
- Validação do carrinho.
- Checkout e preenchimento de endereço.
- Finalização de compra.

### 2. Testes de API

Validação dos serviços REST, contemplando:

- Consulta de usuários existentes.
- Consulta de usuários inexistentes.
- Criação de usuários.
- Atualização de usuários.
- Exclusão de usuários.

### 3. Testes BDD

Os cenários são descritos utilizando Gherkin, com estrutura:

- Given (Dado)
- When (Quando)
- Then (Então)

Essa abordagem facilita a compreensão dos cenários e aproxima as regras de negócio da implementação dos testes.

### 4. Testes Playwright

Execução de testes automatizados utilizando Playwright, com geração de resultados e evidências de execução.

## Estrutura do projeto

```text
outsera-qa-automation/
│
├── features/
│   ├── API/
│   └── WEB/
│
├── step-definitions/
│   ├── API/
│   └── WEB/
│
├── support/
│   └── hooks.js
│
├── tests/
│
├── reports/
│   ├── bdd/
│   ├── html/
│   └── evidences/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── cucumber.js
├── cucumber-report.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Pré-requisitos

Antes de executar o projeto, instale:

- Node.js
- npm
- Git

## Instalação

Clone o repositório:

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git
```

Entre na pasta:

```bash
cd outsera-qa-automation
```

Instale as dependências:

```bash
npm ci
```

Instale o navegador Chromium:

```bash
npx playwright install chromium
```

Configure as variáveis de ambiente necessárias no arquivo `.env`, utilizando como referência um arquivo `.env.example`, sem incluir credenciais reais no repositório.

## Execução dos testes

### Testes BDD completos

```bash
npm run test:bdd
```

### Testes Web

```bash
npm run test:web
```

### Testes de API

```bash
npm run test:api
```

### Testes Playwright

```bash
npm run test:playwright
```

### Execução Web, API e Playwright

```bash
npm run test:all
```

### Geração do relatório HTML BDD

```bash
npm run report
```

### Execução BDD com geração do relatório

```bash
npm run test:report
```

## Integração contínua — GitHub Actions

O projeto possui pipeline automatizado configurado com GitHub Actions.

A execução é acionada por:

- Push na branch `main`.
- Pull Request direcionado à branch `main`.
- Execução manual pelo GitHub Actions.

### Jobs do pipeline

| Job | Descrição |
|---|---|
| BDD Tests | Executa os cenários BDD |
| Web Tests | Executa os testes Web |
| API Tests | Executa os testes de API |
| Playwright Tests | Executa os testes Playwright |
| Generate Final Report | Organiza e disponibiliza os relatórios |

Os resultados são disponibilizados como artefatos para consulta após a execução do pipeline.

## Relatórios e evidências

O projeto gera:

- Relatório JSON dos testes BDD.
- Relatórios JSON dos testes Web e API.
- Relatório HTML BDD.
- Resultados e evidências dos testes Playwright.
- Artefatos disponibilizados pelo GitHub Actions.

**Observação:** o relatório HTML atual é referente aos testes BDD. Os resultados das demais suítes são disponibilizados separadamente nos artefatos do pipeline.

## Boas práticas aplicadas

- Organização dos cenários por domínio.
- Separação entre funcionalidades Web e API.
- Reutilização de código por meio de Step Definitions.
- Hooks para gerenciamento do navegador.
- Execução headless no pipeline.
- Captura de evidências em cenários Web com falha.
- Gerenciamento de configurações por variáveis de ambiente.
- Integração contínua com GitHub Actions.

## Repositório

**GitHub:** https://github.com/diasmoura/outsera-qa-automation

---

Desenvolvido como parte de um desafio técnico de QA Automation.

**Foco:** Qualidade de Software | Automação Web | API Testing | BDD | Playwright | CI/CD