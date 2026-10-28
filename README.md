# Outsera QA Automation

Projeto de automação de testes de API e aplicações Web, desenvolvido em JavaScript com Playwright e Cucumber.js. O projeto utiliza BDD, Page Objects, validações automatizadas, relatórios de execução e integração contínua com GitHub Actions.

O objetivo é demonstrar boas práticas de automação de testes, organização de código, cobertura de cenários positivos e negativos e execução automatizada em pipeline CI/CD.

## Objetivos

- Automatizar testes de APIs REST.
- Validar fluxos funcionais de aplicações Web.
- Implementar cenários BDD com Cucumber.js.
- Validar respostas HTTP, dados e comportamentos esperados.
- Executar testes positivos e negativos.
- Gerar relatórios e evidências de execução.
- Integrar os testes a um pipeline de CI/CD.

## Tecnologias e ferramentas

| Tecnologia | Utilização |
|---|---|
| Node.js 24 | Ambiente de execução JavaScript |
| JavaScript | Linguagem utilizada no projeto |
| Cucumber.js 13 | Especificação e execução de cenários BDD |
| Playwright 1.64 | Automação Web e testes de API |
| JSONPlaceholder | API pública de demonstração para testes de usuários |
| GitHub Actions | Integração e execução contínua |
| multiple-cucumber-html-reporter | Geração de relatórios HTML do Cucumber |
| Git e GitHub | Versionamento e hospedagem do código |

As versões devem ser conferidas no `package.json` e no ambiente utilizado para executar os testes.

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
│   ├── usuarios-crud.steps.js
│   ├── usuarios.steps.js
│   ├── web.hooks.js
│   └── web.steps.js
├── tests/
│   └── api.spec.js
├── reports/
│   └── evidences/
├── playwright-report/
├── test-results/
├── cucumber-report.js
├── package.json
├── package-lock.json
└── README.md
```

**Observação:** a estrutura acima representa a organização esperada dos arquivos principais. Os diretórios de relatórios e evidências podem ser criados durante a execução dos testes.

## Pré-requisitos

Antes de iniciar, instale:

- Node.js e npm.
- Git.
- Navegadores e dependências necessários para o Playwright.
- Acesso à internet para os testes que utilizam serviços externos.

## Instalação e configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git
cd outsera-qa-automation
```

### 2. Instalar as dependências

```bash
npm ci
```

### 3. Instalar os navegadores do Playwright

```bash
npx playwright install
```

Em ambientes Linux ou CI, instale também as dependências do sistema:

```bash
npx playwright install --with-deps
```

## Execução dos testes

### Testes BDD com Cucumber

Executa os cenários definidos nos arquivos `.feature`:

```bash
npm run test:bdd
```

O resultado JSON é gerado em:

```text
reports/cucumber-report.json
```

### Gerar o relatório HTML do Cucumber

```bash
npm run report
```

Para executar os testes BDD e gerar o relatório na mesma sequência:

```bash
npm run test:report
```

O relatório HTML é disponibilizado em `reports/html/`, conforme a configuração do projeto.

### Testes de API

Executa os testes automatizados definidos em `tests/api.spec.js`:

```bash
npx playwright test tests/api.spec.js
```

Os cenários incluem consultas, criação, atualização e exclusão simuladas, além de respostas para dados ausentes e requisições inválidas.

### Testes Web

```bash
npm run test:web
```

Os testes E2E utilizam Playwright para validar fluxos funcionais da aplicação Web externa.

### Testes completos

Para executar a suíte BDD e os testes Playwright:

```bash
npm run test:all
```

**Importante:** esse comando interrompe a sequência caso a primeira etapa falhe, pois utiliza `&&`.

## Cenários automatizados

### API

- Consulta de usuários existentes.
- Consulta de usuário inexistente.
- Criação de usuário.
- Envio de payload vazio.
- Validação de JSON malformado.
- Atualização de usuário.
- Exclusão de usuário.
- Requisição com método HTTP inválido.

### Web e E2E

- Acesso à aplicação e navegação.
- Abertura do formulário de login.
- Validação de login com credenciais inválidas.
- Adição de produto ao carrinho.
- Verificações funcionais dos fluxos implementados nos arquivos de teste.

A cobertura descrita corresponde aos cenários implementados no projeto e não representa, necessariamente, todos os cenários possíveis de um sistema de e-commerce.

## Relatórios e evidências

Os resultados podem ser consultados nos seguintes diretórios:

| Artefato | Caminho |
|---|---|
| JSON do Cucumber | `reports/cucumber-report.json` |
| HTML do Cucumber | `reports/html/` |
| HTML do Playwright | `playwright-report/` |
| Resultados de testes Playwright | `test-results/` |
| Evidências de tela | `reports/evidences/`, quando geradas |

Para abrir o relatório HTML do Playwright após a execução:

```bash
npx playwright show-report
```

Os relatórios são gerados localmente e também podem ser publicados como artefatos do GitHub Actions, conforme a configuração do workflow.

## Integração contínua — GitHub Actions

O pipeline está definido em:

```text
.github/workflows/playwright.yml
```

O workflow é configurado para executar em eventos de `push` e `pull_request` direcionados às branches `main` e `master`.

### Etapas do pipeline

1. Checkout do repositório.
2. Configuração do Node.js.
3. Instalação das dependências com `npm ci`.
4. Instalação dos navegadores e dependências do Playwright.
5. Execução dos testes BDD com Cucumber.
6. Execução dos testes de API e Web com Playwright.
7. Geração do relatório HTML do Cucumber.
8. Publicação dos relatórios e resultados como artefatos.

### Consultar as execuções

Acesse o pipeline para acompanhar o status dos testes e consultar os relatórios:

[**Abrir GitHub Actions — Outsera QA Automation**](https://github.com/diasmoura/outsera-qa-automation/actions)

## Resultados da execução validada

Com base nos resultados informados durante o desenvolvimento:

- **BDD com Cucumber:** 8 cenários aprovados e 59 passos aprovados.
- **Playwright:** 24 execuções aprovadas, correspondentes a 8 casos de teste executados em Chromium, Firefox e WebKit.
- **CI/CD:** execução do GitHub Actions concluída com sucesso.
- **Relatórios:** artefatos do Cucumber e Playwright publicados no pipeline validado.

Os resultados representam execuções específicas. A quantidade de testes e o resultado podem variar conforme as alterações realizadas no projeto e a disponibilidade dos serviços externos.

## Limitações conhecidas

### API JSONPlaceholder

O JSONPlaceholder é uma API pública de demonstração. Operações de criação, atualização e exclusão simulam respostas HTTP e não garantem persistência real dos dados.

Por isso, os testes demonstram validações técnicas de requisições e respostas, mas não substituem a validação de regras de negócio em uma API real.

### Testes Web

Os testes E2E dependem da disponibilidade e do comportamento do site externo utilizado. Alterações no layout, nos seletores ou nos serviços de terceiros podem exigir manutenção dos testes.

Os cenários negativos de checkout devem ser ampliados conforme as regras e validações efetivamente disponíveis na aplicação.

### Escopo do projeto

Testes de carga com K6 e automação mobile com Appium/Espresso não estão descritos como funcionalidades implementadas nesta versão. Podem ser considerados evoluções futuras.

## Boas práticas aplicadas

- Organização dos cenários por funcionalidade.
- Especificações BDD com linguagem legível.
- Separação entre features, step definitions, Page Objects e testes.
- Asserções explícitas de respostas HTTP e conteúdo.
- Cobertura de cenários positivos e negativos.
- Geração de relatórios e evidências.
- Versionamento do código com Git.
- Execução automatizada em pipeline CI/CD.

## Melhorias futuras

- Ampliar a cobertura de cenários negativos de API e Web.
- Implementar validações de contrato e schema das APIs.
- Adicionar testes de carga com K6.
- Avaliar automação mobile com Appium.
- Aprimorar estratégias de retry, rastreabilidade e evidências.
- Integrar análise estática e verificações de qualidade ao pipeline.

## Autor

**Lucas Moura**

- [GitHub — Repositório Outsera QA Automation](https://github.com/diasmoura/outsera-qa-automation)
- [Perfil no GitHub](https://github.com/diasmoura)