# Outsera QA Automation

Automação de testes Web, API, acessibilidade e performance utilizando JavaScript, Node.js, Playwright, Cucumber, BDD, Axe e K6.

## Sobre o projeto

Este projeto foi desenvolvido como parte de um desafio técnico de QA, com o objetivo de demonstrar estratégias de automação de testes, organização de cenários, validação de funcionalidades, análise de qualidade e acompanhamento de resultados por meio de relatórios e dashboards.

A solução contempla testes funcionais Web e API, automação com Playwright, cenários BDD com Cucumber e Gherkin, testes de acessibilidade com Axe e testes de performance com K6.

A arquitetura combina o Playwright Test Runner e o Cucumber com Playwright, permitindo executar testes independentes e cenários orientados a comportamento, com suporte a Chromium, Firefox e WebKit.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| JavaScript / Node.js | Linguagem e ambiente de execução |
| Playwright | Automação de testes Web e API |
| Cucumber | Execução de cenários BDD |
| Gherkin | Especificação dos cenários de teste |
| Express | Servidor local utilizado nos testes de performance |
| K6 | Testes de performance |
| Axe / Axe-core | Validação automatizada de acessibilidade |
| WCAG | Critérios de acessibilidade |
| Git / GitHub | Versionamento do código |
| GitHub Actions | Integração e execução contínua |
| ESLint | Análise estática e padronização do código |
| HTML / JSON | Relatórios e resultados de execução |

## Estrutura do projeto

```text
outsera-qa-automation/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── performance-load.yml
├── docs/
│   └── USO_DE_IA.md
├── features/
│   ├── API/
│   │   ├── api-consulta-users.feature
│   │   └── api-users.feature
│   └── WEB/
│       ├── accessibility.feature
│       ├── ecommerce-checkout.feature
│       └── login.feature
├── step-definitions/
│   ├── API/
│   │   ├── api-consulta-users.steps.js
│   │   └── api-users.steps.js
│   └── WEB/
│       ├── accessibility.steps.js
│       ├── checkout.steps.js
│       └── login.steps.js
├── pages/
│   ├── accessibility/
│   │   └── home.html
│   └── WEB/
│       ├── AuthPage.js
│       ├── CartCheckoutPage.js
│       ├── HomePage.js
│       └── ProductsPage.js
├── support/
│   └── hooks.js
├── helpers/
│   ├── accessibility.js
│   ├── accessibility-metrics.js
│   └── apiAssertions.js
├── tests/
│   ├── api.spec.js
│   └── ecommerce.spec.js
├── performance/
│   ├── smoke-test.js
│   ├── load-test.js
│   ├── load-test-local.js
│   ├── load-report.js
│   ├── report.js
│   ├── run-k6.js
│   └── server.js
├── scripts/
│   └── run-all-tests.js
├── reports/
│   ├── a11y/
│   ├── api/
│   ├── bdd/
│   ├── consolidated/
│   ├── evidences/
│   ├── html/
│   ├── performance/
│   ├── web/
│   ├── generate-accessibility-dashboard.js
│   ├── generate-accessibility-jira-csv.js
│   └── generate-accessibility-report.js
├── cucumber-report.js
├── cucumber.js
├── dashboard.js
├── eslint.config.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

Os relatórios, históricos e evidências são gerados durante as execuções. São artefatos de execução e não precisam ser versionados no repositório.

## Estratégia de testes

### 1. Testes Web

Automação dos principais fluxos funcionais da aplicação, incluindo:

- Acesso à página inicial.
- Navegação para a lista de produtos.
- Exibição dos produtos.
- Acesso à área de autenticação.
- Interação com o carrinho.
- Fluxos de checkout e pagamento.

Os testes utilizam Playwright e Page Objects para organizar a interação com os elementos da interface.

### 2. Testes de API

Validação de serviços e respostas HTTP, contemplando:

- GET: consulta de registros.
- POST: simulação de criação de registros.
- PUT: simulação de atualização.
- DELETE: simulação de exclusão.
- Validação de códigos HTTP.
- Verificação de estrutura e conteúdo JSON.
- Avaliação de respostas para entradas inválidas.

Os testes utilizam Playwright API Testing e cenários BDD com Cucumber.

### 3. Testes BDD

Utilização de Cucumber e Gherkin para descrever comportamentos e regras de negócio em linguagem próxima à linguagem natural.

Os cenários são organizados em funcionalidades Web e API, com execução por meio de step definitions e hooks.

### 4. Playwright Test Runner e Cross-Browser

O Playwright Test Runner executa testes automatizados de API e Web, com projetos configurados para três navegadores:

- Chromium.
- Firefox.
- WebKit.

A configuração contempla:

- Execução paralela.
- Retries em ambiente CI.
- Trace na primeira nova tentativa.
- Relatórios HTML e JSON.
- Separação dos projetos por navegador.

Os testes Web também são executados por meio do Cucumber com Playwright, utilizando a variável de ambiente `BROWSER` para selecionar o navegador.

As duas estratégias são complementares:

- **Playwright Test Runner:** execução de testes independentes com `test()` e `expect()`.
- **Cucumber + Playwright:** execução de cenários BDD escritos em Gherkin.

### 5. Testes de acessibilidade

Utilização do Axe para identificar problemas de acessibilidade nas principais jornadas Web.

A implementação contempla:

- Análise automatizada com Axe.
- Critérios WCAG 2.0, 2.1 e 2.2.
- Classificação das violações por severidade.
- Histórico de resultados.
- Comparação com baseline.
- Identificação de novas violações e regressões.
- Quality Gates para reprovar novas violações elegíveis.

A comparação com baseline permite acompanhar a evolução da acessibilidade e identificar regressões em relação aos resultados anteriores.

**Observação:** violações já existentes e mantidas no baseline não são automaticamente reprovadas apenas por sua severidade. A reprovação considera novas violações ou aumento das ocorrências em relação à referência configurada.

### 6. Testes de Performance

Utilização do K6 para execução de testes de Smoke e Load.

As análises contemplam:

- Usuários virtuais.
- Volume de requisições.
- Requisições por segundo.
- Tempo médio de resposta.
- Mediana.
- Percentis p90, p95 e p99.
- Taxa de falhas HTTP.
- Checks aprovados e reprovados.
- Validação de thresholds e duração das execuções.

Os resultados são utilizados para avaliar o comportamento da API de teste sob diferentes condições de carga.

**Importante:** os resultados apresentados neste README foram obtidos em ambiente local (`http://localhost:3000`). Eles demonstram a execução da estratégia de performance, mas não representam uma medição de capacidade de produção ou de infraestrutura externa.

## Como executar o projeto

### Pré-requisitos

- Node.js 24 (ou versão compatível com o requisito `>=20` do projeto).
- NPM.
- Git.
- K6 instalado e configurado no ambiente.
- Navegadores do Playwright instalados.

### Clonar o repositório

```bash
git clone https://github.com/diasmoura/outsera-qa-automation.git

cd outsera-qa-automation
```

### Instalar dependências

```bash
npm install
```

Para reproduzir a instalação utilizada no CI:

```bash
npm ci
```

### Instalar os navegadores do Playwright

```bash
npx playwright install chromium firefox webkit
```

### Configurar variáveis de ambiente

Crie seu arquivo `.env` a partir do exemplo:

```cmd
copy .env.example .env
```

Configure as credenciais e os dados de pagamento utilizados nos testes.

Variáveis utilizadas pelos testes Web:

- `QA_LOGIN_EMAIL`
- `QA_LOGIN_PASSWORD`
- `QA_CARD_NAME`
- `QA_CARD_NUMBER`
- `QA_CARD_CVC`
- `QA_CARD_EXPIRY_MONTH`
- `QA_CARD_EXPIRY_YEAR`

O arquivo `.env` contém informações locais e sensíveis e não deve ser enviado ao repositório.

### Executar testes BDD

**Testes Web por navegador:**

```bash
npm run test:web:chromium
npm run test:web:firefox
npm run test:web:webkit
```

**Executar os testes Web nos três navegadores:**

```bash
npm run test:web:cross
```

**Testes de API:**

```bash
npm run test:api
```

**Executar todos os cenários BDD:**

```bash
npm run test:bdd
```

**Executar somente o fluxo de login:**

```bash
npm run test:login
```

**Executar somente o fluxo de checkout:**

```bash
npm run test:checkout
```

**Executar o cenário de adição ao carrinho:**

```bash
npm run test:cart:add
```

### Executar testes Playwright

Executar toda a suíte Playwright Test Runner:

```bash
npm run test:playwright
```

Executar somente os testes Web:

```bash
npx playwright test tests/ecommerce.spec.js
```

Executar somente os testes de API:

```bash
npx playwright test tests/api.spec.js
```

### Abrir relatório Playwright

```bash
npm run test:playwright:report
```

### Executar testes de acessibilidade

```bash
npm run test:a11y
```

Gerar o dashboard específico de acessibilidade:

```bash
npm run test:a11y:dashboard
```

Executar os testes e gerar o relatório de acessibilidade:

```bash
npm run test:a11y:report
```

### Executar testes de performance

**Smoke:**

```bash
npm run test:k6:smoke
```

**Load principal:**

```bash
npm run test:k6:load
```

O projeto também possui um perfil local reduzido em `performance/load-test-local.js`, destinado à validação rápida da configuração.

Os comandos K6 definidos no `package.json` executam os scripts de Smoke e Load principal. A execução do perfil local reduzido não possui um script npm dedicado.

As execuções utilizam a configuração de ambiente definida nos respectivos scripts de performance. O servidor local de teste está implementado em `performance/server.js`.

### Executar validações de qualidade

```bash
npm run lint
npm run audit
```

Executar o conjunto de validações definido no script de qualidade:

```bash
npm run test:quality
```

Esse comando executa ESLint, auditoria de dependências, testes de API e testes Web com Cucumber em Chromium. Não representa a execução integral de Playwright, acessibilidade e K6.

### Executar conjunto BDD completo

```bash
npm run test:all
```

Esse comando executa os testes de API e os testes Web BDD nos três navegadores. Não inclui Playwright Test Runner, acessibilidade ou performance.

### Gerar relatórios e dashboard

Gerar o relatório Cucumber:

```bash
npm run report
```

Gerar o dashboard consolidado:

```bash
npm run dashboard
```

O dashboard depende dos resultados das execuções anteriores.

## Dashboard de qualidade

O projeto possui um dashboard consolidado para acompanhamento dos resultados das execuções automatizadas.

O dashboard apresenta:

- Cenários BDD Web e API.
- Cenários únicos e execuções por navegador.
- Steps executados.
- Testes únicos do Playwright.
- Execuções Playwright por navegador.
- Resultados aprovados, reprovados, instáveis e ignorados.
- Métricas de performance do K6.
- Histórico de execução de performance.
- Links para relatórios detalhados.

### Critério de contabilização

Para evitar duplicidade na apresentação da cobertura:

- **Testes únicos:** cada cenário ou teste definido é contabilizado uma única vez, independentemente da quantidade de navegadores utilizados.
- **Execuções:** cada execução individual em um navegador é contabilizada separadamente.
- **API:** testes de API repetidos em projetos de navegador aparecem uma vez na quantidade de testes únicos e separadamente na quantidade de execuções.
- **BDD e Playwright:** são apresentados em grupos independentes, pois são estratégias distintas e podem validar funcionalidades semelhantes.

Exemplo: um teste Playwright executado em Chromium, Firefox e WebKit representa um teste único e três execuções.

Nos relatórios BDD, a identificação dos cenários considera a funcionalidade, a linha e o nome do cenário. Em cenários Scenario Outline, os exemplos expandidos são contabilizados conforme a estrutura registrada no relatório.

O arquivo HTML é gerado em:

```text
reports/consolidated/index.html
```

Para abrir no Windows CMD:

```cmd
start "" reports\consolidated\index.html
```

**Importante:** execute as suítes desejadas antes de gerar o dashboard, para que os resultados apresentados correspondam às execuções disponíveis nos relatórios.

## Resultados de execução

Resultados registrados durante a validação do projeto em **19/11/2026**.

Os números abaixo representam os resultados disponíveis no dashboard consolidado. Testes únicos e execuções são apresentados separadamente para evitar duplicidade na interpretação da cobertura.

### Playwright Test Runner

| Suíte | Testes únicos | Execuções aprovadas | Falhas |
|---|---:|---:|---:|
| API | 8 | 24 | 0 |
| Web | 3 | 9 | 0 |
| **Total** | **11** | **33** | **0** |

Os 11 testes únicos foram executados nos três projetos configurados: Chromium, Firefox e WebKit.

A suíte API contempla oito testes únicos, totalizando 24 execuções. A suíte Web contempla três testes únicos, totalizando nove execuções.

Todas as 33 execuções Playwright apresentadas foram aprovadas, sem testes instáveis ou ignorados.

### Cucumber + Playwright — Web

| Navegador | Cenários únicos | Execuções aprovadas | Steps aprovados |
|---|---:|---:|---:|
| Chromium | 13 | 13 | 104 |
| Firefox | 13 | 13 | 104 |
| WebKit | 13 | 13 | 104 |
| **Total** | **13** | **39** | **312** |

A suíte contém 13 cenários Web únicos, executados uma vez em cada um dos três navegadores, totalizando 39 execuções e 312 steps.

Todas as execuções apresentadas foram aprovadas.

### Cucumber — API

| Indicador | Resultado |
|---|---:|
| Cenários únicos | 10 |
| Execuções | 10 |
| Execuções aprovadas | 10 |
| Execuções reprovadas | 0 |
| Steps | 76 |

Resultados identificados no relatório JSON utilizado pelo dashboard.

### Performance — K6 Smoke

| Métrica | Resultado |
|---|---:|
| Requisições | 5 |
| Requisições por segundo | 1,00 |
| Tempo médio de resposta | 1,06 ms |
| Mediana (p50) | 1,02 ms |
| p95 | 1,64 ms |
| p99 | 1,75 ms |
| Falhas HTTP | 0,00% |
| Checks aprovados | 15 |
| Checks reprovados | 0 |

**Status:** aprovado. Thresholds de falhas HTTP e checks atendidos.

### Performance — K6 Load Principal

Perfil principal de carga, com duração planejada de nove minutos e rampas progressivas até 500 usuários virtuais.

| Métrica | Resultado |
|---|---:|
| Duração planejada | 9 minutos |
| Duração registrada | 9 min 1 s |
| Usuários virtuais máximos observados | 500 |
| Usuários virtuais máximos alocados | 500 |
| Total de requisições | 200.923 |
| Iterações | 200.923 |
| Requisições por segundo | 371,51 |
| Tempo médio de resposta | 0,86 ms |
| Mediana (p50) | 0,68 ms |
| p90 | 1,66 ms |
| p95 | 1,85 ms |
| p99 | 2,88 ms |
| Tempo máximo | 22,56 ms |
| Falhas HTTP | 0,00% |
| Checks aprovados | 602.769 |
| Checks reprovados | 0 |

**Status:** thresholds de performance atendidos.

A duração registrada foi consistente com o planejamento, dentro da tolerância de 20% utilizada pelo dashboard para validação do perfil de execução.

### Performance — K6 Load Local

Perfil local reduzido, utilizado para validação rápida da configuração e do comportamento do teste.

| Métrica | Resultado |
|---|---:|
| Duração planejada | 15 segundos |
| Duração registrada | 15 segundos |
| Usuários virtuais máximos observados | 5 |
| Usuários virtuais máximos alocados | 5 |
| Total de requisições | 36 |
| Iterações | 36 |
| Requisições por segundo | 2,39 |
| Tempo médio de resposta | 0,70 ms |
| Mediana (p50) | 0,64 ms |
| p90 | 1,08 ms |
| p95 | 1,11 ms |
| p99 | 1,14 ms |
| Tempo máximo | 1,15 ms |
| Falhas HTTP | 0,00% |
| Checks aprovados | 108 |
| Checks reprovados | 0 |

**Status:** thresholds de performance atendidos.

Os resultados de Smoke, Load Principal e Load Local representam execuções específicas registradas em ambiente local. Não constituem garantia de desempenho em outros ambientes, infraestruturas ou condições de carga.

Os tempos de resposta apresentados são métricas observadas nas execuções. Valores muito baixos, especialmente em testes locais, dependem das características do ambiente e não devem ser interpretados como garantia de latência em produção.

## CI/CD — GitHub Actions

O projeto utiliza GitHub Actions para automatizar a validação da qualidade, execução dos testes e geração de relatórios.

### Pipeline principal — `ci.yml`

O workflow é acionado automaticamente em:

- Push na branch `main`.
- Pull Requests direcionados à branch `main`.
- Execução manual pelo GitHub Actions (`workflow_dispatch`).

O pipeline é dividido nos seguintes jobs:

| Job | Responsabilidade |
|---|---|
| Static Quality Gate | Executa ESLint e NPM Audit |
| Web BDD Tests | Executa os cenários Cucumber Web no Chromium |
| API BDD Tests | Executa os cenários Cucumber de API |
| Playwright Tests | Executa os testes automatizados nos projetos Chromium, Firefox e WebKit |
| Performance Smoke Test | Executa o teste de performance Smoke com K6 contra uma API local |
| Generate Consolidated Report | Reúne os artefatos disponíveis e gera os relatórios consolidados e dashboard |

Os resultados são publicados como artefatos do GitHub Actions, com retenção de 15 dias.

O job de consolidação utiliza `if: always()`, permitindo gerar relatórios mesmo quando algum job anterior apresenta falha, desde que existam artefatos disponíveis.

### Pipeline de Performance — `performance-load.yml`

O workflow específico de carga é executado:

- Automaticamente todos os domingos, às 03:00 UTC (00:00 no horário de Brasília).
- Manualmente, mediante confirmação explícita da opção `yes`.

Etapas principais:

- Inicialização da API local de testes.
- Execução do teste de carga com K6.
- Geração do relatório HTML.
- Armazenamento dos resultados como artefatos do GitHub Actions.

Os resultados desse workflow possuem retenção de 30 dias.

### Configuração e segurança

- Node.js 24 nos workflows.
- Instalação reproduzível das dependências com `npm ci`.
- Credenciais Web configuradas por meio de GitHub Secrets.
- Variáveis não sensíveis configuradas por GitHub Variables.
- Permissão de leitura do conteúdo do repositório (`contents: read`).

**Observação sobre performance:** os testes K6 executados pelos workflows utilizam a API local iniciada no próprio runner (`http://localhost:3000`). Os resultados não representam testes contra um ambiente de produção ou staging.

## Diferenciais do projeto

- Automação de testes Web e API.
- Playwright Test Runner e Cucumber com Playwright.
- Cenários BDD com Gherkin.
- Execução cross-browser com Chromium, Firefox e WebKit.
- Contabilização de testes únicos e execuções por navegador.
- Organização com Page Objects e hooks.
- Testes de acessibilidade com Axe.
- Critérios WCAG e comparação com baseline.
- Quality Gates para novas violações de acessibilidade.
- Testes de performance com K6.
- Perfis de Smoke e Load.
- Relatórios HTML e JSON.
- Dashboard consolidado de qualidade.
- Integração contínua com GitHub Actions.
- Configuração de variáveis de ambiente e proteção de dados sensíveis.
- Documentação do uso de Inteligência Artificial e validação dos resultados gerados.

## Documentação complementar

- [Uso de ferramentas de Inteligência Artificial](docs/USO_DE_IA.md)

## Autor

**Lucas Dias**

QA Engineer | Software Quality Assurance | Test Automation

GitHub: [diasmoura/outsera-qa-automation](https://github.com/diasmoura/outsera-qa-automation)

---

Projeto desenvolvido para demonstrar conhecimentos em qualidade de software, automação de testes, BDD, acessibilidade, performance, estratégia cross-browser e integração contínua.
