
const fs = require('fs');
const path = require('path');

const diretorioRelatorios = __dirname;
const diretorioHistorico = path.join(diretorioRelatorios, 'a11y', 'history');

const arquivoAtual = path.join(diretorioRelatorios, 'accessibility-report.json');
const arquivoHtml = path.join(diretorioRelatorios, 'accessibility-dashboard.html');

// ======================================================
// UTILITÁRIOS
// ======================================================

function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
}

function normalizarSeletor(seletor) {
  if (Array.isArray(seletor)) return seletor.join(', ');
  return String(seletor ?? 'Não informado');
}

function normalizarUrl(url) {
  if (!url) return 'URL não informada';

  try {
    const valor = new URL(url);
    valor.hash = '';

    if (valor.pathname.length > 1) {
      valor.pathname = valor.pathname.replace(/\/+$/, '');
    }

    return valor.href;
  } catch {
    return String(url).trim();
  }
}

function obterNomePagina(url) {
  try {
    const caminho = new URL(url).pathname;

    const paginas = {
      '/': 'Home',
      '/checkout': 'Checkout',
      '/login': 'Login',
      '/products': 'Products',
      '/view_cart': 'Cart'
    };

    return paginas[caminho] || caminho || 'Home';
  } catch {
    return url;
  }
}

function obterImpacto(impacto) {
  const valor = String(impacto || 'unknown').toLowerCase();

  return ['critical', 'serious', 'moderate', 'minor'].includes(valor)
    ? valor
    : 'unknown';
}

function impactoMaisGrave(atual, novo) {
  const ordem = {
    critical: 4,
    serious: 3,
    moderate: 2,
    minor: 1,
    unknown: 0
  };

  return ordem[novo] > ordem[atual] ? novo : atual;
}

function obterDataAnalise(analise) {
  return (
    analise.dataAnalise ||
    analise.dataHora ||
    analise.resumo?.dataAnalise ||
    analise.resumo?.dataHora ||
    null
  );
}

function obterTimestamp(data) {
  const timestamp = new Date(data).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatarData(data) {
  if (!data) return 'Data não informada';

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) return esc(data);

  return valor.toLocaleString('pt-BR');
}

function obterElementos(violacao) {
  if (Array.isArray(violacao.elementos)) return violacao.elementos;
  if (Array.isArray(violacao.nodes)) return violacao.nodes;
  return [];
}

function obterEvidencia(elemento) {
  return {
    seletor: normalizarSeletor(
      elemento.seletor ||
      elemento.target ||
      elemento.targets
    ),
    html: elemento.html || elemento.htmlSnippet || '',
    detalhes:
      elemento.detalhes ||
      elemento.failureSummary ||
      elemento.mensagem ||
      ''
  };
}

function chaveRegra(url, id) {
  return `${normalizarUrl(url)}|${String(id || '').toLowerCase()}`;
}

function obterUrlDocumentacao(url) {
  if (!url) return '';

  try {
    const valor = new URL(url);

    if (!['http:', 'https:'].includes(valor.protocol)) return '';

    return valor.href;
  } catch {
    return '';
  }
}

// ======================================================
// BASELINE
// ======================================================

function obterComparacaoBaseline(analise) {
  return (
    analise.comparacaoBaseline ||
    analise.resumo?.comparacaoBaseline ||
    {}
  );
}

function obterStatusBaseline(baseline, quantidadeViolacoes) {
  if (baseline.baselineAplicado !== true) {
    return quantidadeViolacoes === 0 ? 'APROVADO' : 'PENDENTE';
  }

  const status = String(baseline.status || '').toUpperCase();

  if (status === 'APROVADO') return 'APROVADO';
  if (status === 'REPROVADO') return 'REPROVADO';

  return 'PENDENTE';
}

// ======================================================
// RECOMENDAÇÕES DE ACESSIBILIDADE
// ======================================================

function obterRecomendacaoAcessibilidade(id) {
  const recomendacoes = {
    'button-name': {
      titulo: 'Botão sem nome acessível',
      recomendacao: 'Adicionar texto visível ou aria-label descritivo ao botão.',
      criterio: 'O leitor de tela deve identificar claramente a finalidade do botão.',
      wcag: '4.1.2'
    },
    'color-contrast': {
      titulo: 'Contraste insuficiente',
      recomendacao: 'Ajustar as cores do texto e do fundo para atender aos requisitos de contraste.',
      criterio: 'Texto normal deve atingir contraste mínimo de 4.5:1 e texto grande, 3:1.',
      wcag: '1.4.3'
    },
    'link-name': {
      titulo: 'Link sem nome acessível',
      recomendacao: 'Adicionar texto descritivo ou um nome acessível ao link.',
      criterio: 'O leitor de tela deve identificar o destino ou a finalidade do link.',
      wcag: '4.1.2'
    },
    'avoid-inline-spacing': {
      titulo: 'Espaçamento de texto',
      recomendacao: 'Verificar se o espaçamento permite ajustes definidos pelo usuário sem perda de conteúdo.',
      criterio: 'O conteúdo deve permanecer utilizável com ajustes de espaçamento de texto.',
      wcag: '1.4.12'
    },
    label: {
      titulo: 'Campo sem identificação adequada',
      recomendacao: 'Associar um label descritivo ao campo de formulário.',
      criterio: 'O campo deve possuir uma identificação acessível.',
      wcag: '3.3.2'
    }
  };

  return recomendacoes[id] || {
    titulo: 'Verificar regra de acessibilidade',
    recomendacao: 'Analisar a documentação da regra Axe e corrigir a causa identificada.',
    criterio: 'O elemento deve atender aos requisitos de acessibilidade aplicáveis.',
    wcag: 'Consultar documentação da regra'
  };
}

// ======================================================
// CARREGAMENTO DO HISTÓRICO
// ======================================================

function carregarArquivoJson(caminho) {
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (erro) {
    console.warn(
      `[DASHBOARD] Erro ao ler ${path.basename(caminho)}: ${erro.message}`
    );

    return null;
  }
}

function carregarExecucoes() {
  const execucoes = [];

  if (fs.existsSync(diretorioHistorico)) {
    const arquivos = fs.readdirSync(diretorioHistorico)
      .filter(nome => nome.toLowerCase().endsWith('.json'))
      .sort();

    for (const nomeArquivo of arquivos) {
      const caminho = path.join(diretorioHistorico, nomeArquivo);
      const dados = carregarArquivoJson(caminho);

      if (!Array.isArray(dados) || dados.length === 0) continue;

      if (!dados.every(item => item && typeof item === 'object')) {
        console.warn(`[DASHBOARD] Estrutura inválida: ${nomeArquivo}`);
        continue;
      }

      const identificador = dados.find(item => item.identificadorExecucao)
        ?.identificadorExecucao;

      execucoes.push({
        id: identificador || nomeArquivo,
        arquivo: nomeArquivo,
        analises: dados
      });
    }
  }

  if (execucoes.length === 0 && fs.existsSync(arquivoAtual)) {
    const dados = carregarArquivoJson(arquivoAtual);

    if (Array.isArray(dados) && dados.length > 0) {
      execucoes.push({
        id: dados[0].identificadorExecucao || 'Execução atual',
        arquivo: 'accessibility-report.json',
        analises: dados
      });
    }
  }

  return execucoes;
}

// ======================================================
// CONSOLIDAÇÃO DAS ANÁLISES
// Mantém somente o registro mais recente de cada URL.
// ======================================================

function obterAnalisesRecentes(analises) {
  const recentes = new Map();

  for (const analise of analises) {
    const url = normalizarUrl(analise.url || analise.resumo?.url);
    const atual = recentes.get(url);

    if (!atual) {
      recentes.set(url, analise);
      continue;
    }

    const dataAtual = obterTimestamp(obterDataAnalise(atual));
    const dataNova = obterTimestamp(obterDataAnalise(analise));

    if (dataNova >= dataAtual) {
      recentes.set(url, analise);
    }
  }

  return Array.from(recentes.values());
}

function consolidarAnalises(analises) {
  const paginas = new Map();
  const analisesRecentes = obterAnalisesRecentes(analises);

  for (const analise of analisesRecentes) {
    const url = normalizarUrl(analise.url || analise.resumo?.url);
    const baseline = obterComparacaoBaseline(analise);

    const pagina = {
      url,
      nome: obterNomePagina(url),
      violacoes: new Map(),
      datas: [],
      baselineAplicado: baseline.baselineAplicado === true,
      statusBaseline: String(baseline.status || '').toUpperCase(),
      criterioBaseline: baseline.criterio || '',
      novasViolacoesBaseline: Array.isArray(baseline.novasViolacoes)
        ? baseline.novasViolacoes
        : [],
      violacoesConhecidasBaseline: Array.isArray(baseline.violacoesConhecidas)
        ? baseline.violacoesConhecidas
        : [],
      totalElementosExternosExcluidos:
        Number(baseline.totalElementosExternosExcluidos) ||
        Number(analise.totalElementosExternosExcluidos) ||
        (Array.isArray(analise.elementosExternosExcluidos)
          ? analise.elementosExternosExcluidos.length
          : 0)
    };

    const data = obterDataAnalise(analise);

    if (data) pagina.datas.push(data);

    for (const violacao of analise.violacoes || []) {
      const id = String(violacao.id || 'regra-desconhecida');
      const chave = id.toLowerCase();

      const grupoExistente = pagina.violacoes.get(chave);

      const grupo = grupoExistente || {
        url,
        id,
        impacto: obterImpacto(violacao.impacto),
        descricao: violacao.descricao || violacao.description || '',
        documentacao: violacao.documentacao || violacao.help || '',
        elementos: new Map()
      };

      grupo.impacto = impactoMaisGrave(
        grupo.impacto,
        obterImpacto(violacao.impacto)
      );

      if (!grupo.descricao) {
        grupo.descricao = violacao.descricao || violacao.description || '';
      }

      if (!grupo.documentacao) {
        grupo.documentacao = violacao.documentacao || violacao.help || '';
      }

      for (const elemento of obterElementos(violacao)) {
        const evidencia = obterEvidencia(elemento);

        const chaveEvidencia = JSON.stringify([
          evidencia.seletor,
          evidencia.html,
          evidencia.detalhes
        ]);

        if (!grupo.elementos.has(chaveEvidencia)) {
          grupo.elementos.set(chaveEvidencia, evidencia);
        }
      }

      pagina.violacoes.set(chave, grupo);
    }

    pagina.status = obterStatusBaseline(
      baseline,
      pagina.violacoes.size
    );

    paginas.set(url, pagina);
  }

  return Array.from(paginas.values()).map(pagina => ({
    url: pagina.url,
    nome: pagina.nome,
    violacoes: Array.from(pagina.violacoes.values()).map(violacao => ({
      ...violacao,
      elementos: Array.from(violacao.elementos.values())
    })),
    datas: pagina.datas,
    baselineAplicado: pagina.baselineAplicado,
    statusBaseline: pagina.statusBaseline,
    status: pagina.status,
    criterioBaseline: pagina.criterioBaseline,
    novasViolacoesBaseline: pagina.novasViolacoesBaseline,
    violacoesConhecidasBaseline: pagina.violacoesConhecidasBaseline,
    totalElementosExternosExcluidos:
      pagina.totalElementosExternosExcluidos
  }));
}

// ======================================================
// RESUMO DA EXECUÇÃO
// ======================================================

function calcularResumo(analises) {
  const paginas = consolidarAnalises(analises);

  const resumo = {
    paginas: paginas.length,
    aprovadas: 0,
    reprovadas: 0,
    pendentes: 0,
    criticas: 0,
    serias: 0,
    moderadas: 0,
    leves: 0,
    desconhecidas: 0,
    regras: 0,
    elementosAfetados: 0,
    novasViolacoesBaseline: 0,
    elementosExternosExcluidos: 0
  };

  for (const pagina of paginas) {
    if (pagina.status === 'APROVADO') {
      resumo.aprovadas++;
    } else if (pagina.status === 'REPROVADO') {
      resumo.reprovadas++;
    } else {
      resumo.pendentes++;
    }

    resumo.novasViolacoesBaseline +=
      pagina.novasViolacoesBaseline.length;

    resumo.elementosExternosExcluidos +=
      pagina.totalElementosExternosExcluidos;

    // Mantém as violações Axe conhecidas nos indicadores.
    for (const violacao of pagina.violacoes) {
      resumo.regras++;
      resumo.elementosAfetados += violacao.elementos.length;

      switch (violacao.impacto) {
        case 'critical':
          resumo.criticas++;
          break;
        case 'serious':
          resumo.serias++;
          break;
        case 'moderate':
          resumo.moderadas++;
          break;
        case 'minor':
          resumo.leves++;
          break;
        default:
          resumo.desconhecidas++;
      }
    }
  }

  return resumo;
}

// ======================================================
// ORGANIZAÇÃO DAS EXECUÇÕES
// ======================================================

const execucoes = carregarExecucoes();

if (execucoes.length === 0) {
  throw new Error(
    'Nenhuma execução encontrada. Verifique reports/a11y/history ou reports/accessibility-report.json.'
  );
}

const historico = execucoes.map(execucao => {
  const datas = execucao.analises
    .map(obterDataAnalise)
    .filter(Boolean);

  const data = datas.sort(
    (a, b) => obterTimestamp(a) - obterTimestamp(b)
  ).at(-1) || execucao.id;

  const analisesConsolidadas = consolidarAnalises(execucao.analises);

  return {
    ...execucao,
    data,
    analisesConsolidadas,
    resumo: calcularResumo(execucao.analises),
    cobertura: analisesConsolidadas
      .map(pagina => pagina.url)
      .sort()
  };
});

historico.sort((a, b) => obterTimestamp(a.data) - obterTimestamp(b.data));

const ultimaExecucao = historico[historico.length - 1];
const resumoAtual = ultimaExecucao.resumo;

// ======================================================
// IDENTIFICAÇÃO DE COBERTURA E EXECUÇÃO ANTERIOR
// ======================================================

function mesmaCobertura(atual, anterior) {
  if (!atual || !anterior) return false;

  if (atual.cobertura.length !== anterior.cobertura.length) {
    return false;
  }

  return atual.cobertura.every(
    (url, indice) => url === anterior.cobertura[indice]
  );
}

const execucoesComMesmaCobertura = historico.filter(execucao =>
  execucao !== ultimaExecucao &&
  obterTimestamp(execucao.data) < obterTimestamp(ultimaExecucao.data) &&
  mesmaCobertura(ultimaExecucao, execucao)
);

const execucaoAnterior = execucoesComMesmaCobertura.length > 0
  ? execucoesComMesmaCobertura[execucoesComMesmaCobertura.length - 1]
  : null;

// ======================================================
// COMPARAÇÃO ENTRE EXECUÇÕES
// ======================================================

function comparar(atual, anterior) {
  const diferenca = atual - anterior;

  if (diferenca < 0) return `${Math.abs(diferenca)} a menos`;
  if (diferenca > 0) return `${diferenca} a mais`;

  return 'Sem alteração';
}

function obterMapaPaginas(analisesConsolidadas) {
  return new Map(
    analisesConsolidadas.map(pagina => [pagina.url, pagina])
  );
}

function obterAchados(analisesConsolidadas) {
  const achados = [];

  for (const pagina of analisesConsolidadas) {
    for (const violacao of pagina.violacoes) {
      achados.push({
        url: pagina.url,
        nome: pagina.nome,
        id: violacao.id,
        impacto: violacao.impacto,
        descricao: violacao.descricao,
        documentacao: violacao.documentacao,
        evidencias: violacao.elementos
      });
    }
  }

  return achados;
}

function criarChave(achado) {
  return chaveRegra(achado.url, achado.id);
}

function compararExecucoes(atual, anterior) {
  const paginasAtuais = obterMapaPaginas(atual.analisesConsolidadas);
  const paginasAnteriores = obterMapaPaginas(anterior.analisesConsolidadas);

  const urlsAtuais = new Set(paginasAtuais.keys());
  const urlsAnteriores = new Set(paginasAnteriores.keys());

  const paginasComparaveis = [...urlsAtuais].filter(
    url => urlsAnteriores.has(url)
  );

  const paginasAdicionadas = [...urlsAtuais].filter(
    url => !urlsAnteriores.has(url)
  );

  const paginasAusentes = [...urlsAnteriores].filter(
    url => !urlsAtuais.has(url)
  );

  const achadosAtuais = obterAchados(
    paginasComparaveis.map(url => paginasAtuais.get(url))
  );

  const achadosAnteriores = obterAchados(
    paginasComparaveis.map(url => paginasAnteriores.get(url))
  );

  const chavesAtuais = new Set(achadosAtuais.map(criarChave));
  const chavesAnteriores = new Set(achadosAnteriores.map(criarChave));

  return {
    paginasComparaveis,
    paginasAdicionadas,
    paginasAusentes,

    novas: achadosAtuais.filter(
      item => !chavesAnteriores.has(criarChave(item))
    ),

    recorrentes: achadosAtuais.filter(
      item => chavesAnteriores.has(criarChave(item))
    ),

    corrigidas: achadosAnteriores.filter(
      item => !chavesAtuais.has(criarChave(item))
    )
  };
}

const comparacao = execucaoAnterior
  ? compararExecucoes(ultimaExecucao, execucaoAnterior)
  : null;

const novas = comparacao?.novas || [];
const recorrentes = comparacao?.recorrentes || [];
const corrigidas = comparacao?.corrigidas || [];

// ======================================================
// CLASSIFICAÇÃO DAS OCORRÊNCIAS
// ======================================================

const classificacoes = [
  {
    titulo: 'Novas violações',
    quantidade: comparacao ? novas.length : '—',
    classe: 'critical',
    descricao: comparacao
      ? 'Regras identificadas nas páginas comparáveis somente na execução atual.'
      : 'Não existe execução anterior com a mesma cobertura.'
  },
  {
    titulo: 'Violações recorrentes',
    quantidade: comparacao ? recorrentes.length : '—',
    classe: 'serious',
    descricao: comparacao
      ? 'Regras que continuam presentes nas páginas comparáveis.'
      : 'Não existe execução anterior com a mesma cobertura.'
  },
  {
    titulo: 'Não encontradas na execução atual',
    quantidade: comparacao ? corrigidas.length : '—',
    classe: 'fixed',
    descricao: comparacao
      ? 'Regras anteriores não encontradas na execução atual. Validar a correção.'
      : 'Não existe execução anterior com a mesma cobertura.'
  }
];

const classificacoesHtml = classificacoes.map(item => `
  <article class="card ${item.classe}">
    <span>${esc(item.titulo)}</span>
    <strong>${esc(item.quantidade)}</strong>
    <small>${esc(item.descricao)}</small>
  </article>
`).join('');

// ======================================================
// DETALHAMENTO DAS CLASSIFICAÇÕES
// ======================================================

function gerarListaAchados(lista, status) {
  if (!comparacao) {
    return `
      <section class="panel">
        <p>Não existe execução anterior com a mesma cobertura de páginas para comparação.</p>
      </section>
    `;
  }

  if (lista.length === 0) {
    return `
      <section class="panel">
        <p>Nenhuma ocorrência nesta classificação.</p>
      </section>
    `;
  }

  return lista.map(item => {
    const recomendacao = obterRecomendacaoAcessibilidade(item.id);
    const documentacao = obterUrlDocumentacao(item.documentacao);

    return `
      <article class="violation">
        <div class="violation-head">
          <strong>${esc(item.id)}</strong>
          <span class="impact ${esc(status.toLowerCase())}">
            ${esc(status)}
          </span>
        </div>

        <p>${esc(item.descricao)}</p>
        <p><strong>Impacto:</strong> ${esc(item.impacto)}</p>
        <p><strong>Página:</strong> ${esc(item.url)}</p>

        <div class="recommendation">
          <h3>${esc(recomendacao.titulo)}</h3>
          <p><strong>Recomendação de correção:</strong><br>${esc(recomendacao.recomendacao)}</p>
          <p><strong>Critério de aceite:</strong><br>${esc(recomendacao.criterio)}</p>
          <p><strong>Referência WCAG:</strong> ${esc(recomendacao.wcag)}</p>
        </div>

        ${documentacao ? `
          <a href="${esc(documentacao)}" target="_blank" rel="noopener noreferrer">
            Consultar documentação Axe
          </a>
        ` : ''}

        <details>
          <summary>Ver evidências (${item.evidencias.length} elementos)</summary>
          ${item.evidencias.map(evidencia => `
            <div class="evidence">
              <p><strong>Seletor:</strong> ${esc(evidencia.seletor)}</p>
              <pre>${esc(evidencia.html)}</pre>
              <pre>${esc(evidencia.detalhes)}</pre>
            </div>
          `).join('')}
        </details>
      </article>
    `;
  }).join('');
}

const novasHtml = gerarListaAchados(novas, 'Nova');
const recorrentesHtml = gerarListaAchados(recorrentes, 'Recorrente');
const corrigidasHtml = gerarListaAchados(corrigidas, 'Não encontrada');

// ======================================================
// CARDS PRINCIPAIS
// ======================================================

const cards = [
  ['Execuções registradas', historico.length, ''],
  ['Páginas analisadas', resumoAtual.paginas, ''],
  ['Páginas aprovadas', resumoAtual.aprovadas, 'fixed'],
  ['Páginas reprovadas', resumoAtual.reprovadas, 'critical'],
  ['Páginas pendentes', resumoAtual.pendentes, 'moderate'],
  ['Regras com violações Axe', resumoAtual.regras, ''],
  ['Elementos afetados', resumoAtual.elementosAfetados, ''],
  ['Novas violações no baseline', resumoAtual.novasViolacoesBaseline, 'critical'],
  ['Elementos externos excluídos', resumoAtual.elementosExternosExcluidos, ''],
  ['Violações críticas', resumoAtual.criticas, 'critical'],
  ['Violações sérias', resumoAtual.serias, 'serious'],
  ['Violações moderadas', resumoAtual.moderadas, 'moderate'],
  ['Violações leves', resumoAtual.leves, 'minor']
];

const cardsHtml = cards.map(([titulo, valor, classe]) => `
  <article class="card ${classe}">
    <span>${esc(titulo)}</span>
    <strong>${esc(valor)}</strong>
  </article>
`).join('');

// ======================================================
// DISTRIBUIÇÃO DAS VIOLAÇÕES
// ======================================================

const indicadores = [
  ['Violações críticas', resumoAtual.criticas, 'critical'],
  ['Violações sérias', resumoAtual.serias, 'serious'],
  ['Violações moderadas', resumoAtual.moderadas, 'moderate'],
  ['Violações leves', resumoAtual.leves, 'minor'],
  ['Impacto não classificado', resumoAtual.desconhecidas, 'unknown']
];

const barrasHtml = indicadores.map(([nome, valor, classe]) => {
  const percentual = resumoAtual.regras
    ? Math.round((valor / resumoAtual.regras) * 100)
    : 0;

  return `
    <div class="bar-row">
      <span>${esc(nome)}</span>
      <div class="bar-bg">
        <div class="bar ${classe}" style="width:${percentual}%"></div>
      </div>
      <strong>${valor}</strong>
    </div>
  `;
}).join('');

// ======================================================
// RANKING DE PÁGINAS
// ======================================================

const rankingPaginas = ultimaExecucao.analisesConsolidadas
  .map(pagina => ({
    url: pagina.url,
    nome: pagina.nome,
    status: pagina.status,
    regras: pagina.violacoes.length,
    novas: pagina.novasViolacoesBaseline.length,
    elementos: pagina.violacoes.reduce(
      (total, violacao) => total + violacao.elementos.length,
      0
    )
  }))
  .sort((a, b) => {
    if (b.novas !== a.novas) return b.novas - a.novas;
    if (b.regras !== a.regras) return b.regras - a.regras;
    return a.nome.localeCompare(b.nome);
  });

const maiorRanking = Math.max(
  1,
  ...rankingPaginas.map(pagina => pagina.regras)
);

const rankingPaginasHtml = rankingPaginas.map((pagina, indice) => `
  <article class="ranking-item">
    <div class="ranking-info">
      <strong>${indice + 1}º - ${esc(pagina.nome)}</strong>
      <span>
        ${esc(pagina.status)} |
        ${pagina.regras} regras |
        ${pagina.novas} novas |
        ${pagina.elementos} elementos afetados
      </span>
    </div>

    <div class="ranking-bar-bg">
      <div class="ranking-bar" style="width:${(pagina.regras / maiorRanking) * 100}%"></div>
    </div>

    <small>${esc(pagina.url)}</small>
  </article>
`).join('');

// ======================================================
// COMPARAÇÃO RESUMIDA
// ======================================================

const comparacaoHtml = execucaoAnterior
  ? `
    <section class="comparison">
      <article>
        <span>Execução anterior com mesma cobertura</span>
        <strong>${execucaoAnterior.resumo.regras}</strong>
        <small>${esc(formatarData(execucaoAnterior.data))}</small>
      </article>

      <article>
        <span>Execução mais recente</span>
        <strong>${resumoAtual.regras}</strong>
        <small>${esc(formatarData(ultimaExecucao.data))}</small>
      </article>

      <article>
        <span>Páginas comparáveis</span>
        <strong>${comparacao.paginasComparaveis.length}</strong>
        <small>Mesmas páginas nas duas execuções</small>
      </article>

      <article>
        <span>Variação geral de regras</span>
        <strong>${esc(comparar(resumoAtual.regras, execucaoAnterior.resumo.regras))}</strong>
        <small>Comparação com cobertura idêntica</small>
      </article>
    </section>

    <section class="panel">
      <strong>Comparação realizada com cobertura idêntica.</strong>
      <p>Execução de referência: ${esc(execucaoAnterior.arquivo)}</p>
      <p>Execução atual: ${esc(ultimaExecucao.arquivo)}</p>
      <p>As classificações consideram somente as regras presentes em cada página.</p>
    </section>
  `
  : `
    <section class="panel warning">
      <strong>Não existe execução anterior com a mesma cobertura.</strong>
      <p>O dashboard não classificará violações como novas, recorrentes ou corrigidas até existir uma execução comparável.</p>
    </section>
  `;

// ======================================================
// DETALHAMENTO DA ÚLTIMA EXECUÇÃO
// ======================================================

const achadosAtuais = obterAchados(ultimaExecucao.analisesConsolidadas);

const statusPorUrl = new Map(
  ultimaExecucao.analisesConsolidadas.map(pagina => [
    pagina.url,
    pagina
  ])
);

const detalhesHtml = achadosAtuais.map(item => {
  const recomendacao = obterRecomendacaoAcessibilidade(item.id);
  const documentacao = obterUrlDocumentacao(item.documentacao);
  const pagina = statusPorUrl.get(item.url);

  return `
    <article class="violation">
      <div class="violation-head">
        <strong>${esc(item.id)}</strong>
        <span class="impact ${esc(item.impacto)}">
          ${esc(item.impacto)}
        </span>
      </div>

      <p>${esc(item.descricao)}</p>
      <p><strong>Página:</strong> ${esc(item.url)}</p>
      <p><strong>Status da página:</strong> ${esc(pagina?.status || 'PENDENTE')}</p>
      <p><strong>Baseline aplicado:</strong> ${pagina?.baselineAplicado ? 'Sim' : 'Não'}</p>
      <p><strong>Elementos afetados:</strong> ${item.evidencias.length}</p>

      <div class="recommendation">
        <h3>${esc(recomendacao.titulo)}</h3>
        <p><strong>Recomendação de correção:</strong><br>${esc(recomendacao.recomendacao)}</p>
        <p><strong>Critério de aceite:</strong><br>${esc(recomendacao.criterio)}</p>
        <p><strong>Referência WCAG:</strong> ${esc(recomendacao.wcag)}</p>
      </div>

      ${documentacao ? `
        <a href="${esc(documentacao)}" target="_blank" rel="noopener noreferrer">
          Consultar documentação Axe
        </a>
      ` : ''}

      ${item.evidencias.map(elemento => `
        <details>
          <summary>Ver elemento afetado</summary>
          <div class="evidence">
            <p><strong>Seletor:</strong> ${esc(elemento.seletor)}</p>
            <pre>${esc(elemento.html)}</pre>
            <pre>${esc(elemento.detalhes)}</pre>
          </div>
        </details>
      `).join('')}
    </article>
  `;
}).join('');

// ======================================================
// HISTÓRICO EM TABELA
// ======================================================

const linhasHistorico = historico.map((execucao, indice) => {
  const anterior = indice > 0 ? historico[indice - 1] : null;

  let variacao = 'Primeira execução';

  if (anterior) {
    variacao = mesmaCobertura(execucao, anterior)
      ? comparar(execucao.resumo.regras, anterior.resumo.regras)
      : 'Cobertura diferente';
  }

  return `
    <tr>
      <td>${indice + 1}</td>
      <td>${esc(formatarData(execucao.data))}</td>
      <td>${execucao.resumo.paginas}</td>
      <td>${execucao.resumo.regras}</td>
      <td>${execucao.resumo.criticas}</td>
      <td>${execucao.resumo.serias}</td>
      <td>${execucao.resumo.aprovadas}</td>
      <td>${execucao.resumo.reprovadas}</td>
      <td>${execucao.resumo.pendentes}</td>
      <td>${esc(variacao)}</td>
    </tr>
  `;
}).join('');

// ======================================================
// GERAÇÃO DO HTML
// ======================================================

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard de Acessibilidade | Outsera QA</title>

<style>
* { box-sizing: border-box; }

body {
  margin: 0;
  background: #f3f5f9;
  color: #263247;
  font-family: Arial, sans-serif;
}

header {
  background: #18243a;
  color: white;
  padding: 30px 6%;
}

header h1 { margin: 0 0 8px; font-size: 26px; }
header p { margin: 6px 0; color: #cbd5e1; }

main {
  max-width: 1250px;
  margin: 30px auto;
  padding: 0 20px;
}

h2 { margin-top: 32px; }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0000000d;
}

.card span { display: block; color: #64748b; font-size: 13px; }
.card strong { display: block; font-size: 30px; margin-top: 12px; }
.card small { display: block; margin-top: 10px; color: #64748b; font-size: 12px; line-height: 1.5; }

.card.critical strong { color: #dc2626; }
.card.serious strong { color: #d97706; }
.card.moderate strong { color: #2563eb; }
.card.minor strong { color: #64748b; }
.card.fixed strong { color: #16a34a; }

.panel {
  background: white;
  padding: 22px;
  border-radius: 12px;
  margin-top: 18px;
  overflow-x: auto;
}

.warning {
  background: #fff7ed;
  border-left: 4px solid #d97706;
}

.bar-row {
  display: grid;
  grid-template-columns: 170px 1fr 35px;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
}

.bar-bg {
  height: 13px;
  background: #e8edf4;
  border-radius: 10px;
  overflow: hidden;
}

.bar { height: 100%; border-radius: 10px; }
.bar.critical { background: #dc2626; }
.bar.serious { background: #d97706; }
.bar.moderate { background: #2563eb; }
.bar.minor { background: #64748b; }
.bar.unknown { background: #94a3b8; }

.comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.comparison article {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

.comparison span, .comparison small {
  display: block;
  color: #64748b;
}

.comparison strong {
  display: block;
  font-size: 25px;
  margin: 12px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th, td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

th { background: #f8fafc; }

.violation {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin: 14px 0;
  box-shadow: 0 2px 8px #0000000d;
}

.violation-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.impact {
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.impact.critical, .impact.nova { color: #dc2626; }
.impact.serious, .impact.recorrente { color: #d97706; }
.impact.moderate { color: #2563eb; }
.impact.minor { color: #64748b; }
.impact.corrigida { color: #16a34a; }

pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
}

details { margin-top: 14px; }
summary { cursor: pointer; color: #1d4ed8; }
a { color: #1d4ed8; }

footer {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.8;
}

.ranking-item {
  background: white;
  padding: 16px;
  border-radius: 10px;
  margin: 12px 0;
}

.ranking-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.ranking-bar-bg {
  height: 12px;
  background: #e8edf4;
  border-radius: 10px;
  overflow: hidden;
}

.ranking-bar {
  height: 100%;
  background: #2563eb;
  border-radius: 10px;
}

.ranking-item small {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
  color: #64748b;
}

.recommendation {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  padding: 14px 18px;
  margin: 16px 0;
  border-radius: 6px;
}

.recommendation h3 {
  margin-top: 0;
  color: #1d4ed8;
  font-size: 16px;
}

.recommendation p { line-height: 1.6; }

.evidence {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
  margin-top: 12px;
}

@media (max-width: 600px) {
  header { padding: 24px 20px; }
  main { padding: 0 14px; }
  .bar-row { grid-template-columns: 120px 1fr 25px; font-size: 12px; }
  .ranking-info { flex-direction: column; }
}
</style>
</head>

<body>
<header>
  <h1>Dashboard de Acessibilidade</h1>
  <p>Outsera QA Automation | Axe-core + Playwright</p>
  <p>Última execução: ${esc(formatarData(ultimaExecucao.data))}</p>
</header>

<main>
  <h2>Indicadores da última execução</h2>
  <section class="cards">${cardsHtml}</section>

  <h2>Distribuição das violações</h2>
  <section class="panel">${barrasHtml}</section>

  <h2>Comparação entre execuções</h2>
  ${comparacaoHtml}

  <h2>Classificação das violações</h2>
  <section class="cards">${classificacoesHtml}</section>

  <h2>Ranking de páginas com mais violações</h2>
  <section class="panel">
    <p>Páginas ordenadas primeiro pelas novas violações do baseline e depois pela quantidade de regras encontradas.</p>
    ${rankingPaginasHtml || '<p>Nenhuma página analisada.</p>'}
  </section>

  <h2>Novas violações</h2>
  ${novasHtml}

  <h2>Violações recorrentes</h2>
  ${recorrentesHtml}

  <h2>Não encontradas na execução atual</h2>
  ${corrigidasHtml}

  <h2>Histórico de execuções</h2>
  <section class="panel">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Data</th>
          <th>Páginas</th>
          <th>Regras</th>
          <th>Críticas</th>
          <th>Sérias</th>
          <th>Aprovadas</th>
          <th>Reprovadas</th>
          <th>Pendentes</th>
          <th>Variação</th>
        </tr>
      </thead>
      <tbody>${linhasHistorico}</tbody>
    </table>
  </section>

  <h2>Detalhamento da última execução</h2>
  ${detalhesHtml || '<section class="panel"><p>Nenhuma violação encontrada.</p></section>'}
</main>

<footer>
  Relatório gerado automaticamente pelo Outsera QA Automation.
  <br>
  Histórico consultado em reports/a11y/history.
  <br>
  O status aprovado indica ausência de regressões em relação ao baseline aplicado.
  <br>
  Violações conhecidas continuam visíveis nos indicadores e evidências.
  <br>
  As ocorrências não encontradas na execução atual devem ser revalidadas
  antes de serem consideradas efetivamente corrigidas.
</footer>
</body>
</html>`;

// ======================================================
// SALVAR DASHBOARD
// ======================================================

fs.writeFileSync(arquivoHtml, html, 'utf8');

console.log('\n==========================================');
console.log('[DASHBOARD] Dashboard gerado com sucesso!');
console.log('==========================================');

console.log(`[DASHBOARD] Execuções registradas: ${historico.length}`);
console.log(`[DASHBOARD] Páginas analisadas: ${resumoAtual.paginas}`);
console.log(`[DASHBOARD] Páginas aprovadas: ${resumoAtual.aprovadas}`);
console.log(`[DASHBOARD] Páginas reprovadas: ${resumoAtual.reprovadas}`);
console.log(`[DASHBOARD] Páginas pendentes: ${resumoAtual.pendentes}`);
console.log(`[DASHBOARD] Regras com violações Axe: ${resumoAtual.regras}`);
console.log(`[DASHBOARD] Elementos afetados: ${resumoAtual.elementosAfetados}`);
console.log(`[DASHBOARD] Novas violações no baseline: ${resumoAtual.novasViolacoesBaseline}`);
console.log(`[DASHBOARD] Elementos externos excluídos: ${resumoAtual.elementosExternosExcluidos}`);
console.log(`[DASHBOARD] Violações críticas: ${resumoAtual.criticas}`);
console.log(`[DASHBOARD] Violações sérias: ${resumoAtual.serias}`);
console.log(`[DASHBOARD] Violações moderadas: ${resumoAtual.moderadas}`);
console.log(`[DASHBOARD] Violações leves: ${resumoAtual.leves}`);

if (execucaoAnterior) {
  console.log('\n[DASHBOARD] Comparação com execução de mesma cobertura:');
  console.log(`[DASHBOARD] Referência: ${execucaoAnterior.arquivo}`);
  console.log(`[DASHBOARD] Páginas comparáveis: ${comparacao.paginasComparaveis.length}`);
  console.log(`[DASHBOARD] Novas ocorrências: ${novas.length}`);
  console.log(`[DASHBOARD] Recorrentes: ${recorrentes.length}`);
  console.log(`[DASHBOARD] Não encontradas na execução atual: ${corrigidas.length}`);
  console.log(`[DASHBOARD] Páginas adicionadas: ${comparacao.paginasAdicionadas.length}`);
  console.log(`[DASHBOARD] Páginas ausentes: ${comparacao.paginasAusentes.length}`);
} else {
  console.log('\n[DASHBOARD] Não existe execução anterior com a mesma cobertura.');
}

console.log(`[DASHBOARD] Arquivo: ${arquivoHtml}`);
