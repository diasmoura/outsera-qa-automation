# Uso de Inteligência Artificial no Desenvolvimento e Manutenção

## 1. Objetivo

Documentar a utilização de ferramentas de Inteligência Artificial (IA) como apoio ao desenvolvimento, manutenção, revisão e evolução da solução Outsera QA Automation.

## 2. Ferramentas utilizadas

Foi utilizado o ChatGPT, da OpenAI, como ferramenta de apoio técnico durante o desenvolvimento e a manutenção da automação de testes.

A ferramenta foi utilizada como suporte à análise de problemas, elaboração de código, revisão de implementações, documentação técnica e identificação de possíveis melhorias.

## 3. Aplicações no projeto

A IA foi utilizada como apoio nas seguintes atividades:

- Estruturação e evolução da arquitetura de automação.
- Desenvolvimento e revisão de testes automatizados Web e API.
- Implementação e manutenção de Page Objects e Steps do Cucumber.
- Apoio na criação de testes de acessibilidade com Axe.
- Desenvolvimento e revisão de scripts de performance com K6.
- Construção e manutenção de relatórios e dashboard consolidado.
- Revisão de configurações de ESLint e GitHub Actions.
- Identificação e análise de erros durante a execução dos testes.
- Apoio na elaboração do README e da documentação técnica.

## 4. Processo de validação dos resultados gerados

Todo conteúdo técnico sugerido pela IA foi tratado como uma proposta sujeita à análise e validação.

A validação foi realizada por meio de:

- Revisão do código antes de sua incorporação ao projeto.
- Execução dos testes automatizados para verificar o comportamento implementado.
- Execução do ESLint para identificar problemas de qualidade estática.
- Execução do NPM Audit para verificar vulnerabilidades conhecidas nas dependências.
- Verificação dos relatórios gerados e dos resultados das execuções.
- Análise dos erros e ajustes necessários até obter resultados consistentes.

Nenhuma sugestão de IA foi considerada válida exclusivamente por ter sido gerada pela ferramenta.

## 5. Evidências de validação

Durante o desenvolvimento, foram obtidos os seguintes resultados de execução:

| Validação | Resultado registrado |
|---|---|
| Cucumber Web - Chromium | 13 cenários e 104 steps aprovados |
| Cucumber Web - Firefox | 13 cenários e 104 steps aprovados |
| Cucumber Web - WebKit | 13 cenários e 104 steps aprovados |
| Cucumber API | 10 cenários e 76 steps aprovados |
| Playwright | 33 execuções aprovadas |
| ESLint | Sem erros ou warnings na última execução |
| NPM Audit | 0 vulnerabilidades encontradas |

Os resultados representam execuções registradas durante o desenvolvimento e não devem ser interpretados como garantia permanente de ausência de defeitos.

## 6. Responsabilidade técnica

A utilização de IA não substituiu a análise crítica, as decisões de arquitetura, a implementação, a execução dos testes ou a responsabilidade técnica sobre a solução.

A aprovação final das alterações dependeu da revisão e validação dos resultados no ambiente de desenvolvimento.

## 7. Considerações finais

A Inteligência Artificial foi utilizada como ferramenta complementar para aumentar a produtividade, apoiar a resolução de problemas e contribuir para a evolução da solução.

A confiabilidade das implementações foi avaliada por meio de revisão técnica, execução de testes automatizados e ferramentas de análise estática e de dependências.