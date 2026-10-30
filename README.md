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
| Gherkin | Especificação dos cenários em linguagem legível |
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

**Cobertura:** 8 testes executados em 3 engines, totalizando 24 execuções de testes.

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

#### Resultados da execução no GitHub Actions

| Métrica | Resultado |
|---|---:|
| Usuários virtuais máximos | 500 |
| Total de requisições | 200.985 |
| Requisições por segundo | 371,73 |
| Tempo médio | 0,70 ms |
| Mediana | 0,60 ms |
| Percentil 90 (p90) | 1,31 ms |
| Percentil 95 (p95) | 1,55 ms |
| Tempo máximo | 9,54 ms |
| Falhas HTTP | 0,00% |
| Checks aprovados | 602.955 |
| Checks reprovados | 0 |

#### Thresholds configurados

- Taxa de falhas HTTP inferior a 1%.
- Percentil 95 inferior a 1.000 ms.
- Taxa de checks superior a 99%.

#### Validação dos thresholds

| Critério | Resultado | Status |
|---|---:|---|
| Falhas HTTP abaixo de 1% | 0,00% | **ATENDIDO** |
| p95 abaixo de 1.000 ms | 1,55 ms | **ATENDIDO** |
| Checks acima de 99% | 100,00% | **ATENDIDO** |

#### Análise dos resultados

O teste registrou 500 usuários virtuais máximos e 200.985 requisições, alcançando uma vazão de 371,73 requisições por segundo.

O tempo médio de resposta foi de 0,70 ms, enquanto o percentil 95 (p95) foi de 1,55 ms. A taxa de falhas HTTP foi de 0,00%, e os 602.955 checks executados foram aprovados, sem reprovações.

Os resultados demonstram desempenho positivo da API mock no ambiente avaliado, com baixa latência e atendimento a todos os thresholds configurados.

**Limitação do ambiente:** a API mock e o K6 foram executados no mesmo runner do GitHub Actions. Portanto, os resultados representam uma validação técnica do ambiente de teste e não uma medição isolada da capacidade de uma infraestrutura de produção.

Para uma análise mais completa de possíveis gargalos, recomenda-se monitorar CPU, memória, rede e logs da API durante a execução, além de realizar testes com o gerador de carga separado do servidor.

> Observação: a duração média da iteração inclui o `sleep(1)` configurado no script K6. Portanto, não representa exclusivamente o tempo de resposta da API.

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

Os relatórios e evidências podem ser baixados na página da execução do workflow. A retenção configurada dos artefatos é de 15 dias.

### Histórico da última execução validada

- Pipeline: #12.
- Branch: `main`.
- Commit: `fcc399b`.
- Status: **Success**.
- Jobs aprovados: 5 de 5.

*Esse resultado corresponde à execução #12, anterior à validação da nova integração do Dashboard.*

### Artefatos gerados na execução #12

- `web-results`
- `api-results`
- `playwright-results`
- `performance-results`
- `qa-automation-final-report`

A nova integração do Dashboard deverá ser validada em uma execução posterior do workflow.

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

**Testes de API:**

```bash
npm run test:api
```

**Testes Web:**

```bash
npm run test:web
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

**Evidências e relatórios disponíveis:**

- Relatórios Cucumber.
- Relatórios HTML do Playwright.
- Screenshots dos cenários automatizados.
- Relatórios JSON do K6.
- Relatórios HTML de performance.
- Relatórios consolidados.
- Dashboard de Qualidade.
- Artefatos disponibilizados pela pipeline do GitHub Actions.

**Visualizar o relatório HTML do Playwright:**

```bash
npx playwright show-report
```

**Relatórios de performance:**

- `reports/performance/smoke-summary.json`
- `reports/performance/load-summary.json`
- `reports/performance/load-report.html`

O Dashboard consolidado é gerado por:

```bash
node dashboard.js
```

Os artefatos gerados pelo GitHub Actions podem ser baixados diretamente na página de execução da pipeline.

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
| Playwright API | 24 execuções |
| Performance K6 | Até 500 usuários virtuais |
| GitHub Actions | 5 jobs aprovados na execução #12 |

**Total de cenários BDD:** 13 aprovados, com 104 steps aprovados nas execuções apresentadas.

**Resultado histórico da pipeline:** todos os cinco jobs foram concluídos com sucesso na execução #12.

## 11. Repositório

**GitHub:** https://github.com/diasmoura/outsera-qa-automation

---

**Projeto desenvolvido para demonstrar conhecimentos em Qualidade de Software, automação de testes, testes de API, BDD, Playwright, performance, organização de código, geração de relatórios e integração contínua.**