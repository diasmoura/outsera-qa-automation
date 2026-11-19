
const fs = require('fs');
const path = require('path');

const AxeBuilderModule = require('@axe-core/playwright');
const AxeBuilder = AxeBuilderModule.default || AxeBuilderModule;

// ==========================================
// IDENTIFICAÇÃO E PERSISTÊNCIA DA EXECUÇÃO
// ==========================================

const diretorioHistorico = path.join(
  __dirname,
  '..',
  'reports',
  'a11y',
  'history'
);

const identificadorExecucao = new Date()
  .toISOString()
  .replace(/[:.]/g, '-');

const arquivoHistorico = path.join(
  diretorioHistorico,
  `accessibility-${identificadorExecucao}.json`
);

const analisesExecucao = [];

// ==========================================
// PERSISTÊNCIA DO HISTÓRICO
// ==========================================

function salvarHistorico(analise) {
  fs.mkdirSync(diretorioHistorico, {
    recursive: true
  });

  analisesExecucao.push(analise);

  fs.writeFileSync(
    arquivoHistorico,
    JSON.stringify(analisesExecucao, null, 2),
    'utf8'
  );

  console.log('\n[A11Y] Histórico atualizado.');
  console.log(`[A11Y] Execução: ${identificadorExecucao}`);
  console.log(`[A11Y] Páginas registradas: ${analisesExecucao.length}`);
  console.log(`[A11Y] Arquivo: ${arquivoHistorico}`);
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function contarElementos(violacoes) {
  return violacoes.reduce(
    (total, violacao) => total + (violacao.nodes || []).length,
    0
  );
}

function formatarSeveridade(impacto) {
  const severidades = {
    critical: 'CRÍTICA',
    serious: 'SÉRIA',
    moderate: 'MODERADA',
    minor: 'LEVE',
    unknown: 'NÃO INFORMADA'
  };

  return severidades[impacto] || 'NÃO INFORMADA';
}

function serializarDados(dados) {
  if (dados === undefined || dados === null) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(dados));
  } catch {
    return String(dados);
  }
}

function obterSeletor(target) {
  if (Array.isArray(target)) {
    return target.flat(Infinity).map(String);
  }

  return target ? [String(target)] : [];
}

// ==========================================
// IDENTIFICAÇÃO DE FRAMES DE PUBLICIDADE
// ==========================================

async function obterFramesPublicidade(page) {
  const framesPublicidade = [];

  const dominiosPublicidade = [
    /(^|\.)googleads\.g\.doubleclick\.net$/i,
    /(^|\.)googlesyndication\.com$/i,
    /(^|\.)doubleclick\.net$/i,
    /(^|\.)googleadservices\.com$/i
  ];

  for (const frame of page.frames()) {
    try {
      const url = frame.url();

      if (!url || url === 'about:blank') {
        continue;
      }

      let hostname;

      try {
        hostname = new URL(url).hostname;
      } catch {
        continue;
      }

      if (
        dominiosPublicidade.some(regex => regex.test(hostname))
      ) {
        framesPublicidade.push({
          url,
          hostname,
          tipo: 'FRAME_PUBLICIDADE_GOOGLE'
        });
      }
    } catch {
      continue;
    }
  }

  return framesPublicidade;
}

// ==========================================
// IDENTIFICAÇÃO DE ANOTAÇÕES GOOGLE NO DOM
// ==========================================

async function verificarAnotacaoGoogle(page, seletores) {
  const classesGoogle = [
    'google-anno-skip',
    'google-anno-sc',
    'google-anno',
    'goog-rentries',
    'goog-rentry'
  ];

  for (const seletor of seletores) {
    if (!seletor || typeof seletor !== 'string') {
      continue;
    }

    try {
      const locator = page.locator(seletor).first();
      const existe = await locator.count();

      if (!existe) {
        continue;
      }

      const identificacao = await locator.evaluate(
        (elemento, marcadores) => {
          let atual = elemento;

          while (atual && atual.nodeType === 1) {
            const classes = atual.classList;

            const classesEncontradas = marcadores.filter(
              classe => classes?.contains(classe)
            );

            const atributoVignette =
              atual.getAttribute('data-google-vignette');

            const atributoInterstitial =
              atual.getAttribute('data-google-interstitial');

            const possuiAtributoGoogle =
              atributoVignette === 'false' ||
              atributoInterstitial === 'false';

            const possuiMarcadorGoogle =
              classesEncontradas.length > 0;

            const possuiEstruturaGoogle =
              classes?.contains('goog-rentries') ||
              classes?.contains('goog-rentry');

            const anotacaoIdentificada =
              (possuiMarcadorGoogle && possuiAtributoGoogle) ||
              possuiEstruturaGoogle;

            if (anotacaoIdentificada) {
              return {
                identificada: true,
                tag: atual.tagName,
                id: atual.id || null,
                classes: atual.className,
                classesEncontradas,
                dataGoogleVignette: atributoVignette,
                dataGoogleInterstitial: atributoInterstitial,
                html: atual.outerHTML
              };
            }

            atual = atual.parentElement;
          }

          return {
            identificada: false
          };
        },
        classesGoogle
      );

      if (identificacao.identificada) {
        return identificacao;
      }
    } catch {
      continue;
    }
  }

  return {
    identificada: false
  };
}

// ==========================================
// IDENTIFICAÇÃO DE ANÚNCIOS GOOGLE
// ==========================================

function identificarGoogleAdsPeloContexto(seletores, html) {
  const caminhoSeletores = (seletores || []).join(' ');
  const htmlElemento = html || '';

  const marcadoresDeContainer = [
    /#aswift_\d+/i,
    /#google_ad_[\w-]+/i,
    /#google_ads_iframe_[\w-]+/i,
    /google_ads_iframe/i
  ];

  const containerGoogleIdentificado =
    marcadoresDeContainer.some(regex =>
      regex.test(caminhoSeletores)
    );

  if (containerGoogleIdentificado) {
    return {
      identificada: true,
      motivo:
        'Cadeia de seletores contém identificador específico de container de publicidade Google.'
    };
  }

  const possuiAswift = /#aswift_\d+/i.test(caminhoSeletores);
  const possuiAdIframe = /#ad_iframe\b/i.test(caminhoSeletores);

  if (possuiAswift && possuiAdIframe) {
    return {
      identificada: true,
      motivo:
        'Cadeia de seletores contém container aswift e ad_iframe.'
    };
  }

  const marcadoresHTML = [
    /data-asoch-targets\s*=/i,
    /googlesyndication\.com/i,
    /doubleclick\.net/i,
    /google_ads_iframe/i,
    /google_ad_\d+/i,
    /aswift_\d+/i
  ];

  if (marcadoresHTML.some(regex => regex.test(htmlElemento))) {
    return {
      identificada: true,
      motivo:
        'HTML contém marcador específico de publicidade Google.'
    };
  }

  return {
    identificada: false,
    motivo: null
  };
}

// ==========================================
// IDENTIFICAÇÃO DE ANÚNCIO PELO CONTEXTO DOM
// ==========================================

async function verificarContextoAnuncioGoogle(page, seletores) {
  for (const seletor of seletores) {
    if (!seletor || typeof seletor !== 'string') {
      continue;
    }

    try {
      const locator = page.locator(seletor).first();
      const existe = await locator.count();

      if (!existe) {
        continue;
      }

      const contexto = await locator.evaluate(elemento => {
        const evidencias = [];

        let atual = elemento;
        let nivel = 0;

        const regexContainer =
          /^(aswift_\d+|google_ad_[\w-]+|google_ads_iframe_[\w-]+)$/i;

        const regexDominio =
          /(^|\.)((googleads\.g\.doubleclick\.net)|(googlesyndication\.com)|(doubleclick\.net)|(googleadservices\.com))$/i;

        while (atual && atual.nodeType === 1 && nivel < 12) {
          const id = atual.id || '';

          const classes =
            typeof atual.className === 'string'
              ? atual.className
              : '';

          const src = atual.getAttribute('src') || '';
          const href = atual.getAttribute('href') || '';

          if (regexContainer.test(id)) {
            evidencias.push({
              tipo: 'CONTAINER_GOOGLE',
              tag: atual.tagName,
              id,
              classes
            });
          }

          for (const valor of [src, href]) {
            if (!valor) {
              continue;
            }

            try {
              const hostname = new URL(
                valor,
                document.baseURI
              ).hostname;

              if (regexDominio.test(hostname)) {
                evidencias.push({
                  tipo: 'URL_PUBLICIDADE_GOOGLE',
                  tag: atual.tagName,
                  id,
                  hostname,
                  url: valor
                });
              }
            } catch {
              // URL não reconhecida: não gera evidência.
            }
          }

          atual = atual.parentElement;
          nivel++;
        }

        return {
          identificada: evidencias.length > 0,
          evidencias
        };
      });

      if (contexto.identificada) {
        return contexto;
      }
    } catch {
      continue;
    }
  }

  return {
    identificada: false,
    evidencias: []
  };
}

// ==========================================
// IDENTIFICAÇÃO DE ELEMENTOS EXTERNOS
// ==========================================

async function identificarElementosExternos(page, violacoes) {
  const violacoesElegiveis = [];
  const elementosExternosExcluidos = [];

  for (const violacao of violacoes) {
    const nodesElegiveis = [];

    for (const node of violacao.nodes || []) {
      const seletores = obterSeletor(node.target);
      const html = node.html || '';

      // 1. IDENTIFICAÇÃO DIRETA DE ANÚNCIOS

      const anuncioGoogle = identificarGoogleAdsPeloContexto(
        seletores,
        html
      );

      if (anuncioGoogle.identificada) {
        elementosExternosExcluidos.push({
          regra: violacao.id || 'regra-desconhecida',
          seletor: seletores,
          html,
          tipo: 'ANUNCIO_GOOGLE',
          elementoGoogle: null,
          motivo: anuncioGoogle.motivo
        });

        continue;
      }

      // 2. IDENTIFICAÇÃO PELO CONTEXTO DOM

      const contextoAnuncio =
        await verificarContextoAnuncioGoogle(
          page,
          seletores
        );

      if (contextoAnuncio.identificada) {
        elementosExternosExcluidos.push({
          regra: violacao.id || 'regra-desconhecida',
          seletor: seletores,
          html,
          tipo: 'ANUNCIO_GOOGLE',
          elementoGoogle: contextoAnuncio.evidencias,
          motivo:
            'Elemento possui ancestral identificado como container ou URL de publicidade Google.'
        });

        continue;
      }

      // 3. IDENTIFICAÇÃO DE ANOTAÇÕES GOOGLE

      const resultadoDOM = await verificarAnotacaoGoogle(
        page,
        seletores
      );

      const identificacaoPeloHTML =
        (
          html.includes('google-anno-skip') ||
          html.includes('google-anno-sc') ||
          html.includes('google-anno')
        ) &&
        (
          html.includes('data-google-vignette="false"') ||
          html.includes("data-google-vignette='false'") ||
          html.includes('data-google-interstitial="false"') ||
          html.includes("data-google-interstitial='false'")
        );

      const anotacaoGoogle =
        resultadoDOM.identificada || identificacaoPeloHTML;

      if (anotacaoGoogle) {
        elementosExternosExcluidos.push({
          regra: violacao.id || 'regra-desconhecida',
          seletor: seletores,
          html,
          tipo: 'ANOTACAO_GOOGLE',

          elementoGoogle: resultadoDOM.identificada
            ? resultadoDOM
            : null,

          motivo: resultadoDOM.identificada
            ? 'Elemento ou ancestral identificado no DOM como anotação Google, por classe específica ou estrutura Google.'
            : 'Elemento identificado pelo HTML como anotação Google, com classe específica e atributo Google.'
        });

        continue;
      }

      // 4. ELEMENTOS DA APLICAÇÃO

      nodesElegiveis.push(node);
    }

    if (nodesElegiveis.length > 0) {
      violacoesElegiveis.push({
        ...violacao,
        nodes: nodesElegiveis
      });
    }
  }

  return {
    violacoesElegiveis,
    elementosExternosExcluidos
  };
}

// ==========================================
// BASELINES DE ACESSIBILIDADE
// ==========================================

function obterViolacoesPorRegra(violacoes) {
  return violacoes.reduce((acumulado, violacao) => {
    const id = violacao.id || 'regra-desconhecida';

    acumulado[id] =
      (acumulado[id] || 0) +
      (violacao.nodes || []).length;

    return acumulado;
  }, {});
}

// ==========================================
// IDENTIFICAÇÃO DO BASELINE POR URL
// ==========================================

function obterBaseline(url) {
  let endereco;

  try {
    endereco = new URL(url);
  } catch {
    console.error(
      '[A11Y] URL inválida para identificação do baseline:',
      url
    );

    return null;
  }

  const host = endereco.hostname.toLowerCase();
  const caminho = endereco.pathname.replace(/\/+$/, '') || '/';

  if (host !== 'automationexercise.com') {
    return null;
  }

  const baselines = {
    '/': {
      'button-name': 1,
      'color-contrast': 38,
      'link-name': 4
    },

    '/checkout': {
      'avoid-inline-spacing': 5,
      'button-name': 1,
      'color-contrast': 11,
      'label': 1
    },

    '/login': {
      'button-name': 1,
      'color-contrast': 1
    },

    '/products': {
      'button-name': 2,
      'color-contrast': 35
    },

    '/view_cart': {
      'avoid-inline-spacing': 5,
      'button-name': 1,
      'color-contrast': 9
    }
  };

  const baseline = baselines[caminho];

  if (!baseline) {
    console.warn(
      `[A11Y] Baseline não cadastrado para a rota: ${caminho}`
    );

    return null;
  }

  console.log(`[A11Y] Baseline identificado: ${caminho}`);

  return { ...baseline };
}

// ==========================================
// COMPARAÇÃO COM BASELINE
// ==========================================

function compararComBaseline(url, violacoesPorRegra) {
  const baseline = obterBaseline(url);

  const novasViolacoes = [];
  const violacoesConhecidas = [];

  for (const [regra, quantidadeAtual] of Object.entries(
    violacoesPorRegra
  )) {
    const quantidadeBaseline = baseline
      ? baseline[regra] || 0
      : 0;

    if (quantidadeAtual > quantidadeBaseline) {
      novasViolacoes.push({
        regra,
        quantidadeBaseline,
        quantidadeAtual,
        diferenca: quantidadeAtual - quantidadeBaseline
      });
    } else if (quantidadeAtual > 0 && baseline) {
      violacoesConhecidas.push({
        regra,
        quantidadeBaseline,
        quantidadeAtual
      });
    }
  }

  const status =
    novasViolacoes.length > 0 ? 'REPROVADO' : 'APROVADO';

  return {
    baselineAplicado: Boolean(baseline),
    baseline: baseline || {},
    status,

    criterio: baseline
      ? 'Sem aumento de elementos por regra em relação ao baseline, desconsiderando apenas anúncios e anotações Google identificados por evidências específicas.'
      : 'Validação estrita: nenhuma violação elegível é permitida.',

    novasViolacoes,
    violacoesConhecidas
  };
}

// ==========================================
// DETALHAMENTO DAS VERIFICAÇÕES DO AXE
// ==========================================

function formatarChecks(checks = []) {
  return checks.map(check => ({
    id: check.id || 'verificacao-nao-identificada',
    mensagem: check.message || '',
    impacto: check.impact || 'unknown',
    ajuda: check.help || '',
    documentacao: check.helpUrl || '',
    dados: serializarDados(check.data),

    nosRelacionados: (check.relatedNodes || []).map(node => ({
      seletor: obterSeletor(node.target),
      html: node.html || '',
      detalhes: node.failureSummary || ''
    }))
  }));
}

// ==========================================
// EXTRAÇÃO DAS EVIDÊNCIAS DOS ELEMENTOS
// ==========================================

function formatarElemento(node, violacao) {
  return {
    impacto: node.impact || violacao.impact || 'unknown',
    seletor: obterSeletor(node.target),
    html: node.html || '',
    detalhes: node.failureSummary || '',

    verificacoes: {
      any: formatarChecks(node.any),
      all: formatarChecks(node.all),
      none: formatarChecks(node.none)
    }
  };
}

// ==========================================
// FORMATAÇÃO DAS VIOLAÇÕES
// ==========================================

function formatarViolacoes(violacoes) {
  return violacoes.map(violacao => ({
    id: violacao.id || 'regra-desconhecida',
    impacto: violacao.impact || 'unknown',
    severidade: formatarSeveridade(violacao.impact),
    descricao: violacao.help || '',
    documentacao: violacao.helpUrl || '',
    tags: violacao.tags || [],

    elementos: (violacao.nodes || []).map(node =>
      formatarElemento(node, violacao)
    )
  }));
}

// ==========================================
// DIAGNÓSTICO DAS VERIFICAÇÕES
// ==========================================

function exibirChecks(tipo, checks) {
  if (!checks || checks.length === 0) {
    return;
  }

  console.log(`\n  Verificações ${tipo.toUpperCase()}:`);

  for (const check of checks) {
    console.log(`    ID: ${check.id || 'Não identificado'}`);
    console.log(`    Mensagem: ${check.message || 'Não informada'}`);

    if (check.impact) {
      console.log(`    Impacto: ${check.impact}`);
    }

    if (check.data !== undefined && check.data !== null) {
      console.log(`    Dados: ${JSON.stringify(check.data)}`);
    }

    if (check.relatedNodes?.length) {
      console.log('    Elementos relacionados:');

      for (const related of check.relatedNodes) {
        console.log(
          `      Seletor: ${obterSeletor(related.target).join(', ') || 'Não identificado'}`
        );

        console.log(
          `      HTML: ${related.html || 'Não disponível'}`
        );
      }
    }
  }
}

// ==========================================
// DIAGNÓSTICO DETALHADO
// ==========================================

function exibirDiagnostico(violacoes) {
  console.log(
    '\n========== DIAGNÓSTICO DAS VIOLAÇÕES =========='
  );

  if (violacoes.length === 0) {
    console.log('[A11Y] Nenhuma regra violada.');
    return;
  }

  for (const [index, violacao] of violacoes.entries()) {
    const elementos = violacao.nodes || [];

    console.log(
      '\n----------------------------------------------------'
    );

    console.log(`[A11Y] VIOLAÇÃO ${index + 1}`);

    console.log(
      '----------------------------------------------------'
    );

    console.log(`Regra: ${violacao.id || 'Não identificada'}`);

    console.log(
      `Severidade: ${formatarSeveridade(violacao.impact)}`
    );

    console.log(`Descrição: ${violacao.help || 'Não informada'}`);
    console.log(`Elementos afetados: ${elementos.length}`);

    console.log(
      `Documentação: ${violacao.helpUrl || 'Não disponível'}`
    );

    for (const [nodeIndex, node] of elementos.entries()) {
      console.log(`\n  ELEMENTO ${nodeIndex + 1}`);
      console.log('  ------------------------------------------');

      console.log(
        `  Seletor: ${obterSeletor(node.target).join(', ') || 'Não identificado'}`
      );

      console.log(`  HTML: ${node.html || 'Não disponível'}`);

      console.log(
        `  Severidade: ${formatarSeveridade(node.impact || violacao.impact)}`
      );

      if (node.failureSummary) {
        console.log('\n  RESUMO DO PROBLEMA:');
        console.log(node.failureSummary);
      }

      exibirChecks('any', node.any);
      exibirChecks('all', node.all);
      exibirChecks('none', node.none);
    }
  }
}

// ==========================================
// VALIDAÇÃO DE ACESSIBILIDADE
// ==========================================

async function validarAcessibilidade(page) {
  if (!page) {
    throw new Error(
      '[A11Y] Erro: a página não foi informada.'
    );
  }

  if (typeof page.isClosed !== 'function') {
    throw new Error(
      '[A11Y] Erro: objeto de página inválido.'
    );
  }

  if (page.isClosed()) {
    throw new Error(
      '[A11Y] Erro: a página está fechada. Verifique os hooks do navegador.'
    );
  }

  console.log(
    '\n===================================================='
  );

  console.log(
    '       INICIANDO ANÁLISE DE ACESSIBILIDADE'
  );

  console.log(
    '===================================================='
  );

  let resultado;

  try {
    resultado = await new AxeBuilder({ page })
      .withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22aa'
      ])
      .analyze();
  } catch (erro) {
    console.error(
      '\n[A11Y] FALHA TÉCNICA DURANTE A ANÁLISE.'
    );

    console.error(`[A11Y] Motivo: ${erro.message}`);

    throw new Error(
      '[A11Y] Não foi possível concluir a análise. ' +
      `Verifique se a página carregou corretamente. Detalhe: ${erro.message}`,
      { cause: erro }
    );
  }

  // ==========================================
  // RESULTADOS BRUTOS DO AXE
  // ==========================================

  const violacoes = resultado.violations || [];
  const aprovadas = resultado.passes || [];
  const incompletas = resultado.incomplete || [];
  const naoAplicaveis = resultado.inapplicable || [];

  // ==========================================
  // CONTEXTO DOS FRAMES DE PUBLICIDADE
  // ==========================================

  const framesPublicidade = await obterFramesPublicidade(page);

  console.log(
    `[A11Y] Frames de publicidade Google identificados: ${framesPublicidade.length}`
  );

  for (const frame of framesPublicidade) {
    console.log(`[A11Y] Frame externo: ${frame.hostname}`);
  }

  // ==========================================
  // CONTAGEM POR SEVERIDADE - RESULTADO BRUTO
  // ==========================================

  const impactos = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0
  };

  for (const violacao of violacoes) {
    const impacto = violacao.impact || 'unknown';

    impactos[impacto] =
      (impactos[impacto] || 0) + 1;
  }

  const totalElementosAfetados = contarElementos(violacoes);

  // ==========================================
  // IDENTIFICAÇÃO DE ELEMENTOS EXTERNOS
  // ==========================================

  const {
    violacoesElegiveis,
    elementosExternosExcluidos
  } = await identificarElementosExternos(
    page,
    violacoes
  );

  const totalElementosElegiveis =
    contarElementos(violacoesElegiveis);

  const violacoesPorRegra =
    obterViolacoesPorRegra(violacoesElegiveis);

  const statusAxe =
    violacoes.length > 0 ? 'REPROVADO' : 'APROVADO';

  // ==========================================
  // COMPARAÇÃO COM BASELINE
  // ==========================================

  const comparacaoBaseline = compararComBaseline(
    page.url(),
    violacoesPorRegra
  );

  comparacaoBaseline.elementosExternosExcluidos =
    elementosExternosExcluidos;

  comparacaoBaseline.totalElementosExternosExcluidos =
    elementosExternosExcluidos.length;

  // ==========================================
  // RESUMO DA ANÁLISE
  // ==========================================

  const resumo = {
    url: page.url(),
    dataAnalise: new Date().toISOString(),
    status: comparacaoBaseline.status,
    statusAxe,
    comparacaoBaseline,

    indicadores: {
      regrasAprovadas: aprovadas.length,
      regrasComViolacoes: violacoes.length,
      elementosAfetados: totalElementosAfetados,
      elementosElegiveis: totalElementosElegiveis,

      elementosExternosExcluidos:
        elementosExternosExcluidos.length,

      framesPublicidadeGoogle: framesPublicidade.length,
      violacoesPorRegra,

      critical: impactos.critical,
      serious: impactos.serious,
      moderate: impactos.moderate,
      minor: impactos.minor,
      semImpactoInformado: impactos.unknown,

      analisesIncompletas: incompletas.length,
      naoAplicaveis: naoAplicaveis.length
    }
  };

  // ==========================================
  // REGISTRO HISTÓRICO
  // ==========================================

  const registro = {
    dataHora: resumo.dataAnalise,
    identificadorExecucao,
    url: resumo.url,

    resumo: {
      totalViolacoes: violacoes.length,
      criticas: impactos.critical,
      serias: impactos.serious,
      moderadas: impactos.moderate,
      leves: impactos.minor,
      semImpactoInformado: impactos.unknown,

      regrasAprovadas: aprovadas.length,
      elementosAfetados: totalElementosAfetados,
      elementosElegiveis: totalElementosElegiveis,

      elementosExternosExcluidos:
        elementosExternosExcluidos.length,

      framesPublicidadeGoogle: framesPublicidade.length,
      analisesIncompletas: incompletas.length,
      naoAplicaveis: naoAplicaveis.length,

      resultado: resumo.status,
      resultadoAxe: resumo.statusAxe,
      comparacaoBaseline: resumo.comparacaoBaseline
    },

    indicadores: resumo.indicadores,
    comparacaoBaseline: resumo.comparacaoBaseline,
    elementosExternosExcluidos,
    framesPublicidadeGoogle: framesPublicidade,

    violacoes: formatarViolacoes(violacoes),

    resultadoAxe: serializarDados(resultado)
  };

  salvarHistorico(registro);

  // ==========================================
  // INDICADORES GERAIS
  // ==========================================

  console.log(
    '\n========== INDICADORES DE ACESSIBILIDADE =========='
  );

  console.log(`Página analisada: ${resumo.url}`);

  console.log(
    `Data da análise: ${new Date(resumo.dataAnalise).toLocaleString('pt-BR')}`
  );

  console.log('\n---------- RESULTADOS ----------');

  console.log(`Regras aprovadas: ${aprovadas.length}`);
  console.log(`Regras com violações: ${violacoes.length}`);

  console.log(
    `Elementos afetados pelo Axe: ${totalElementosAfetados}`
  );

  console.log(
    `Elementos elegíveis para baseline: ${totalElementosElegiveis}`
  );

  console.log(
    `Elementos externos excluídos da comparação: ${elementosExternosExcluidos.length}`
  );

  // ==========================================
  // SEVERIDADE
  // ==========================================

  console.log('\n---------- SEVERIDADE ----------');

  console.log(`[A11Y] Violações críticas: ${impactos.critical}`);
  console.log(`[A11Y] Violações sérias: ${impactos.serious}`);
  console.log(`[A11Y] Violações moderadas: ${impactos.moderate}`);
  console.log(`[A11Y] Violações leves: ${impactos.minor}`);

  if (impactos.unknown > 0) {
    console.log(
      `[A11Y] Violações sem classificação: ${impactos.unknown}`
    );
  }

  // ==========================================
  // ANÁLISES COMPLEMENTARES
  // ==========================================

  console.log(
    '\n---------- ANÁLISES COMPLEMENTARES ----------'
  );

  console.log(`Análises incompletas: ${incompletas.length}`);
  console.log(`Regras não aplicáveis: ${naoAplicaveis.length}`);

  if (incompletas.length > 0) {
    console.log(
      '[A11Y] ATENÇÃO: existem itens que precisam de avaliação manual.'
    );
  }

  // ==========================================
  // DIAGNÓSTICO DETALHADO
  // ==========================================

  exibirDiagnostico(violacoes);

  // ==========================================
  // RESULTADO AXE
  // ==========================================

  console.log('\n========== RESULTADO AXE ==========');

  console.log(
    `[A11Y] Resultado bruto do Axe: ${statusAxe}.`
  );

  console.log(
    `[A11Y] Regras com violações: ${violacoes.length}.`
  );

  console.log(
    `[A11Y] Elementos afetados: ${totalElementosAfetados}.`
  );

  // ==========================================
  // ELEMENTOS EXTERNOS IDENTIFICADOS
  // ==========================================

  console.log('\n========== ELEMENTOS EXTERNOS ==========');

  console.log(
    `[A11Y] Elementos excluídos somente da comparação: ${elementosExternosExcluidos.length}.`
  );

  for (const elemento of elementosExternosExcluidos) {
    console.log(
      `[A11Y] Tipo: ${elemento.tipo || 'ELEMENTO EXTERNO'}`
    );

    console.log(`[A11Y] Regra: ${elemento.regra}`);

    console.log(
      `[A11Y] Seletor: ${elemento.seletor.join(', ')}`
    );

    console.log(`[A11Y] Motivo: ${elemento.motivo}`);
  }

  // ==========================================
  // COMPARAÇÃO COM BASELINE
  // ==========================================

  console.log('\n========== COMPARAÇÃO COM BASELINE ==========');

  console.log(
    `[A11Y] Baseline aplicado: ${comparacaoBaseline.baselineAplicado ? 'SIM' : 'NÃO'}`
  );

  console.log(
    `[A11Y] Resultado da comparação: ${comparacaoBaseline.status}.`
  );

  console.log(
    `[A11Y] Critério: ${comparacaoBaseline.criterio}`
  );

  if (comparacaoBaseline.novasViolacoes.length > 0) {
    console.error(
      '[A11Y] NOVAS VIOLAÇÕES OU AUMENTO DE ELEMENTOS:'
    );

    for (const item of comparacaoBaseline.novasViolacoes) {
      console.error(
        `[A11Y] ${item.regra}: ` +
        `baseline=${item.quantidadeBaseline}, ` +
        `atual=${item.quantidadeAtual}, ` +
        `diferença=+${item.diferenca}`
      );
    }
  } else if (
    comparacaoBaseline.violacoesConhecidas.length > 0
  ) {
    console.warn(
      '[A11Y] Violações conhecidas permanecem registradas; ' +
      'nenhuma regressão foi identificada.'
    );
  } else {
    console.log(
      '[A11Y] Nenhuma violação elegível foi identificada pelo Axe.'
    );
  }

  console.log(
    '====================================================\n'
  );

  return resumo;
}

// ==========================================
// EXPORTAÇÃO
// ==========================================

module.exports = {
  validarAcessibilidade
};
