
const fs = require('fs');
const path = require('path');

const diretorioRelatorios = __dirname;

const diretorioHistorico = path.join(
  diretorioRelatorios,
  'a11y',
  'history'
);

const arquivoAtual = path.join(
  diretorioRelatorios,
  'accessibility-report.json'
);

const arquivoHtml = path.join(
  diretorioRelatorios,
  'accessibility-dashboard.html'
);

// ======================================================
// UTILITÁRIOS
// ======================================================

const esc = (valor) =>
  String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);

function normalizarSeletor(seletor) {
  if (Array.isArray(seletor)) {
    return seletor.join(', ');
  }

  return String(seletor ?? 'Não informado');
}

// ======================================================
// RECOMENDAÇÕES DE ACESSIBILIDADE
// ======================================================

function obterRecomendacaoAcessibilidade(id) {
  const recomendacoes = {
    'button-name': {
      titulo: 'Nome acessível para botões',
      recomendacao:
        'Adicionar um nome acessível ao botão utilizando texto visível ou aria-label. Ícones decorativos devem utilizar aria-hidden="true".',
      criterio:
        'Todos os botões devem possuir um nome acessível identificável por tecnologias assistivas.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'color-contrast': {
      titulo: 'Contraste de cores',
      recomendacao:
        'Ajustar as cores do texto e do fundo para garantir contraste suficiente entre os elementos.',
      criterio:
        'Textos comuns devem apresentar contraste mínimo de 4.5:1. Textos grandes devem apresentar contraste mínimo de 3:1.',
      wcag: 'WCAG 1.4.3 - Contraste mínimo'
    },

    'link-name': {
      titulo: 'Nome acessível para links',
      recomendacao:
        'Adicionar texto descritivo ou um nome acessível aos links. Evitar links sem conteúdo identificável.',
      criterio:
        'Todos os links devem possuir um nome acessível que permita compreender sua finalidade.',
      wcag: 'WCAG 2.4.4 - Finalidade do link'
    },

    'image-alt': {
      titulo: 'Texto alternativo para imagens',
      recomendacao:
        'Adicionar atributo alt descritivo às imagens informativas. Imagens decorativas devem utilizar alt vazio.',
      criterio:
        'Imagens informativas devem possuir descrição alternativa adequada.',
      wcag: 'WCAG 1.1.1 - Conteúdo não textual'
    },

    'label': {
      titulo: 'Identificação de campos',
      recomendacao:
        'Associar cada campo de formulário a um label visível ou nome acessível.',
      criterio:
        'Todos os campos devem possuir identificação compreensível por tecnologias assistivas.',
      wcag: 'WCAG 3.3.2 - Rótulos ou instruções'
    },

    'html-has-lang': {
      titulo: 'Idioma do documento',
      recomendacao:
        'Adicionar o atributo lang ao elemento HTML, identificando o idioma principal da página.',
      criterio:
        'O documento deve declarar corretamente seu idioma principal.',
      wcag: 'WCAG 3.1.1 - Idioma da página'
    },

    'document-title': {
      titulo: 'Título da página',
      recomendacao:
        'Adicionar um título descritivo e exclusivo ao documento HTML.',
      criterio:
        'Cada página deve apresentar um título que descreva seu conteúdo ou finalidade.',
      wcag: 'WCAG 2.4.2 - Página com título'
    },

    'heading-order': {
      titulo: 'Hierarquia de títulos',
      recomendacao:
        'Organizar os títulos da página em uma sequência hierárquica lógica, evitando saltos desnecessários entre níveis.',
      criterio:
        'Os títulos devem representar corretamente a estrutura e a hierarquia do conteúdo.',
      wcag: 'WCAG 1.3.1 - Informações e relações'
    },

    'landmark-one-main': {
      titulo: 'Região principal da página',
      recomendacao:
        'Adicionar uma região principal utilizando o elemento main ou o papel main.',
      criterio:
        'A página deve possuir uma região principal identificável por tecnologias assistivas.',
      wcag: 'WCAG 1.3.1 - Informações e relações'
    },

    'aria-allowed-attr': {
      titulo: 'Atributos ARIA permitidos',
      recomendacao:
        'Revisar os atributos ARIA utilizados nos elementos e remover ou corrigir atributos incompatíveis com suas funções.',
      criterio:
        'Os atributos ARIA devem ser válidos e compatíveis com a função dos elementos.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'aria-required-attr': {
      titulo: 'Atributos ARIA obrigatórios',
      recomendacao:
        'Adicionar os atributos ARIA obrigatórios para o papel utilizado pelo elemento.',
      criterio:
        'Elementos com papéis ARIA devem apresentar os atributos obrigatórios correspondentes.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'aria-valid-attr': {
      titulo: 'Atributos ARIA válidos',
      recomendacao:
        'Corrigir atributos ARIA inválidos ou não reconhecidos.',
      criterio:
        'Todos os atributos ARIA utilizados devem ser válidos.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'aria-valid-attr-value': {
      titulo: 'Valores de atributos ARIA',
      recomendacao:
        'Corrigir os valores dos atributos ARIA conforme os valores permitidos pela especificação.',
      criterio:
        'Os atributos ARIA devem apresentar valores válidos e reconhecidos.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'aria-hidden-focus': {
      titulo: 'Foco em elementos ocultos',
      recomendacao:
        'Evitar que elementos focáveis permaneçam dentro de regiões marcadas como aria-hidden="true".',
      criterio:
        'Elementos ocultos para tecnologias assistivas não devem receber foco indevidamente.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'form-field-multiple-labels': {
      titulo: 'Múltiplos rótulos em campos',
      recomendacao:
        'Revisar a associação de labels para evitar múltiplos rótulos conflitantes no mesmo campo.',
      criterio:
        'Os campos devem possuir identificação clara e consistente.',
      wcag: 'WCAG 3.3.2 - Rótulos ou instruções'
    },

    'input-button-name': {
      titulo: 'Nome acessível para botões de formulário',
      recomendacao:
        'Adicionar um valor ou nome acessível aos campos de entrada que funcionam como botões.',
      criterio:
        'Todos os botões de formulário devem possuir nome acessível.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    },

    'select-name': {
      titulo: 'Nome acessível para listas de seleção',
      recomendacao:
        'Associar um label ou nome acessível a cada elemento select.',
      criterio:
        'Todos os campos de seleção devem possuir identificação acessível.',
      wcag: 'WCAG 4.1.2 - Nome, função e valor'
    }
  };

  return recomendacoes[id] || {
    titulo: 'Revisar regra de acessibilidade',
    recomendacao:
      'Analisar os elementos identificados pelo Axe e aplicar a correção necessária conforme a documentação da regra.',
    criterio:
      'A página deve atender aos requisitos da regra identificada, sem ocorrências na nova análise.',
    wcag: 'Consultar documentação da regra Axe'
  };
}

// ======================================================
// CARREGAMENTO DO HISTÓRICO
// ======================================================

function carregarExecucoes() {
  let arquivos = [];

  if (fs.existsSync(diretorioHistorico)) {
    arquivos = fs.readdirSync(diretorioHistorico)
      .filter(nome => nome.endsWith('.json'))
      .sort();
  }

  const execucoes = [];

  for (const nomeArquivo of arquivos) {
    const caminho = path.join(
      diretorioHistorico,
      nomeArquivo
    );

    try {
      const dados = JSON.parse(
        fs.readFileSync(caminho, 'utf8')
      );

      if (!Array.isArray(dados) || dados.length === 0) {
        continue;
      }

      execucoes.push({
        id: dados[0].identificadorExecucao || nomeArquivo,
        arquivo: nomeArquivo,
        analises: dados
      });

    } catch (erro) {
      console.warn(
        `[DASHBOARD] Não foi possível ler ${nomeArquivo}: ${erro.message}`
      );
    }
  }

  // Fallback para o relatório atual.

  if (execucoes.length === 0 && fs.existsSync(arquivoAtual)) {
    try {
      const dados = JSON.parse(
        fs.readFileSync(arquivoAtual, 'utf8')
      );

      if (Array.isArray(dados) && dados.length > 0) {
        execucoes.push({
          id: dados[0].identificadorExecucao || 'Execução atual',
          arquivo: 'accessibility-report.json',
          analises: dados
        });
      }

    } catch (erro) {
      console.warn(
        `[DASHBOARD] Não foi possível ler o relatório atual: ${erro.message}`
      );
    }
  }

  return execucoes;
}

// ======================================================
// RESUMO DA EXECUÇÃO
// ======================================================

function calcularResumo(analises) {
  const resumo = {
    paginas: analises.length,
    aprovadas: 0,
    reprovadas: 0,
    criticas: 0,
    serias: 0,
    moderadas: 0,
    leves: 0,
    regras: 0,
    elementos: 0
  };

  for (const analise of analises) {
    const violacoes = analise.violacoes || [];

    const resultado = analise.resumo?.resultado ||
      analise.resumo?.status;

    if (resultado === 'APROVADO' || violacoes.length === 0) {
      resumo.aprovadas++;
    } else {
      resumo.reprovadas++;
    }

    for (const violacao of violacoes) {
      const impacto = (violacao.impacto || '').toLowerCase();

      resumo.regras++;
      resumo.elementos += (violacao.elementos || []).length;

      if (impacto === 'critical') {
        resumo.criticas++;
      } else if (impacto === 'serious') {
        resumo.serias++;
      } else if (impacto === 'moderate') {
        resumo.moderadas++;
      } else if (impacto === 'minor') {
        resumo.leves++;
      }
    }
  }

  return resumo;
}

// ======================================================
// DATAS
// ======================================================

function obterData(execucao) {
  const datas = execucao.analises
    .map(item => item.dataHora || item.dataAnalise)
    .filter(Boolean)
    .sort();

  return datas[0] || execucao.id;
}

function formatarData(data) {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return esc(data);
  }

  return valor.toLocaleString('pt-BR');
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

const historico = execucoes.map(execucao => ({
  ...execucao,
  data: obterData(execucao),
  resumo: calcularResumo(execucao.analises)
}));

historico.sort((a, b) => {
  const dataA = new Date(a.data).getTime();
  const dataB = new Date(b.data).getTime();

  if (Number.isNaN(dataA) || Number.isNaN(dataB)) {
    return String(a.data).localeCompare(String(b.data));
  }

  return dataA - dataB;
});

const ultimaExecucao = historico[historico.length - 1];

const resumoAtual = ultimaExecucao.resumo;

const execucaoAnterior = historico.length > 1
  ? historico[historico.length - 2]
  : null;

// ======================================================
// COMPARAÇÃO ENTRE EXECUÇÕES
// ======================================================

function comparar(atual, anterior) {
  if (!anterior) {
    return 'Primeira execução registrada';
  }

  const diferenca = atual - anterior;

  if (diferenca < 0) {
    return `${Math.abs(diferenca)} a menos`;
  }

  if (diferenca > 0) {
    return `${diferenca} a mais`;
  }

  return 'Sem alteração';
}

// ======================================================
// EXTRAÇÃO DOS ACHADOS
// ======================================================

function obterAchados(analises) {
  const achados = [];

  for (const analise of analises) {
    for (const violacao of analise.violacoes || []) {
      const elementos = violacao.elementos || [];

      if (elementos.length === 0) {
        achados.push({
          url: analise.url,
          id: violacao.id,
          impacto: (violacao.impacto || '').toLowerCase(),
          descricao: violacao.descricao,
          documentacao: violacao.documentacao,
          seletores: ['Regra sem seletor identificado'],
          html: '',
          detalhes: ''
        });

        continue;
      }

      for (const elemento of elementos) {
        achados.push({
          url: analise.url,
          id: violacao.id,
          impacto: (violacao.impacto || '').toLowerCase(),
          descricao: violacao.descricao,
          documentacao: violacao.documentacao,
          seletor: normalizarSeletor(elemento.seletor),
          html: elemento.html || '',
          detalhes: elemento.detalhes || ''
        });
      }
    }
  }

  return achados;
}

// ======================================================
// IDENTIFICAÇÃO DOS BUGS
// ======================================================

function normalizarUrlPagina(url) {
  try {
    const endereco = new URL(url);

    let pathname = endereco.pathname
      .replace(/\/+$/, '')
      .toLowerCase();

    if (!pathname) {
      pathname = '/';
    }

    return `${endereco.origin.toLowerCase()}${pathname}`;
  } catch {
    return String(url || '').toLowerCase();
  }
}

function criarChave(achado) {
  return [
    normalizarUrlPagina(achado.url),
    achado.id
  ].join('|').toLowerCase();
}

// ======================================================
// AGRUPAMENTO DOS ACHADOS
// ======================================================

function agruparAchados(achados) {
  const grupos = new Map();

  for (const achado of achados) {
    const chave = criarChave(achado);

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        ...achado,
        seletores: [],
        evidencias: []
      });
    }

    const grupo = grupos.get(chave);

    if (achado.seletor) {
      if (!grupo.seletores.includes(achado.seletor)) {
        grupo.seletores.push(achado.seletor);
      }

      grupo.evidencias.push({
        seletor: achado.seletor,
        html: achado.html,
        detalhes: achado.detalhes
      });
    }
  }

  return Array.from(grupos.values());
}

// ======================================================
// COMPARAÇÃO DAS OCORRÊNCIAS
// ======================================================

const achadosAtuais = agruparAchados(
  obterAchados(ultimaExecucao.analises)
);

const achadosAnteriores = execucaoAnterior
  ? agruparAchados(obterAchados(execucaoAnterior.analises))
  : [];

const chavesAtuais = new Set(
  achadosAtuais.map(criarChave)
);

const chavesAnteriores = new Set(
  achadosAnteriores.map(criarChave)
);

const novas = achadosAtuais.filter(
  item => !chavesAnteriores.has(criarChave(item))
);

const recorrentes = achadosAtuais.filter(
  item => chavesAnteriores.has(criarChave(item))
);

const corrigidas = achadosAnteriores.filter(
  item => !chavesAtuais.has(criarChave(item))
);

// ======================================================
// CARDS DE CLASSIFICAÇÃO
// ======================================================

const classificacoes = [
  {
    titulo: 'Novas violações',
    quantidade: novas.length,
    classe: 'critical',
    descricao: 'Ocorrências identificadas somente na execução atual.'
  },
  {
    titulo: 'Violações recorrentes',
    quantidade: recorrentes.length,
    classe: 'serious',
    descricao: 'Ocorrências que continuam presentes.'
  },
  {
    titulo: 'Violações corrigidas',
    quantidade: corrigidas.length,
    classe: 'fixed',
    descricao: 'Ocorrências anteriores não encontradas na execução atual.'
  }
];

const classificacoesHtml = classificacoes.map(item => `
  <article class="card ${item.classe}">
    <span>${esc(item.titulo)}</span>
    <strong>${item.quantidade}</strong>
    <small>${esc(item.descricao)}</small>
  </article>
`).join('');

// ======================================================
// DETALHAMENTO DAS CLASSIFICAÇÕES
// ======================================================

function gerarListaAchados(lista, status) {
  if (!execucaoAnterior) {
    return '<p>Execute novamente os testes para habilitar a comparação.</p>';
  }

  if (lista.length === 0) {
    return '<p>Nenhuma ocorrência nesta classificação.</p>';
  }

  return lista.map(item => {
    const recomendacao = obterRecomendacaoAcessibilidade(item.id);

    return `
      <article class="violation">

        <div class="violation-head">
          <strong>${esc(item.id)}</strong>

          <span class="impact ${esc(status.toLowerCase())}">
            ${esc(status)}
          </span>
        </div>

        <p>${esc(item.descricao)}</p>

        <p>
          <strong>Impacto:</strong>
          ${esc(item.impacto)}
        </p>

        <p>
          <strong>Página:</strong>
          ${esc(item.url)}
        </p>

        <p><strong>Seletores:</strong></p>

        <ul>
          ${item.seletores.map(seletor => `
            <li>${esc(seletor)}</li>
          `).join('')}
        </ul>

        <div class="recommendation">
          <h3>${esc(recomendacao.titulo)}</h3>

          <p>
            <strong>Recomendação de correção:</strong><br>
            ${esc(recomendacao.recomendacao)}
          </p>

          <p>
            <strong>Critério de aceite:</strong><br>
            ${esc(recomendacao.criterio)}
          </p>

          <p>
            <strong>Referência WCAG:</strong>
            ${esc(recomendacao.wcag)}
          </p>
        </div>

        ${item.documentacao ? `
          <a href="${esc(item.documentacao)}"
             target="_blank"
             rel="noopener noreferrer">
            Consultar documentação Axe
          </a>
        ` : ''}

        <details>
          <summary>
            Ver evidências (${item.evidencias.length} elementos)
          </summary>

          ${item.evidencias.map(evidencia => `
            <div class="evidence">
              <p>
                <strong>Seletor:</strong>
                ${esc(evidencia.seletor)}
              </p>

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

const recorrentesHtml = gerarListaAchados(
  recorrentes,
  'Recorrente'
);

const corrigidasHtml = gerarListaAchados(
  corrigidas,
  'Corrigida'
);

// ======================================================
// INDICADORES PRINCIPAIS
// ======================================================

const cards = [
  ['Execuções registradas', historico.length, ''],
  ['Páginas analisadas', resumoAtual.paginas, ''],
  ['Violações críticas', resumoAtual.criticas, 'critical'],
  ['Violações sérias', resumoAtual.serias, 'serious'],
  ['Violações moderadas', resumoAtual.moderadas, 'moderate'],
  ['Violações leves', resumoAtual.leves, 'minor']
];

const cardsHtml = cards.map(([titulo, valor, classe]) => `
  <article class="card ${classe}">
    <span>${esc(titulo)}</span>
    <strong>${valor}</strong>
  </article>
`).join('');

// ======================================================
// GRÁFICO DE DISTRIBUIÇÃO
// ======================================================

const indicadores = [
  ['Violações críticas', resumoAtual.criticas, 'critical'],
  ['Violações sérias', resumoAtual.serias, 'serious'],
  ['Violações moderadas', resumoAtual.moderadas, 'moderate'],
  ['Violações leves', resumoAtual.leves, 'minor']
];

const barrasHtml = indicadores.map(([nome, valor, classe]) => {
  const percentual = resumoAtual.regras
    ? Math.round((valor / resumoAtual.regras) * 100)
    : 0;

  return `
    <div class="bar-row">
      <span>${esc(nome)}</span>

      <div class="bar-bg">
        <div
          class="bar ${classe}"
          style="width:${percentual}%">
        </div>
      </div>

      <strong>${valor}</strong>
    </div>
  `;
}).join('');

// ======================================================
// RANKING DE PÁGINAS COM MAIS VIOLAÇÕES
// ======================================================

function obterNomePagina(url) {
  try {
    const caminho = new URL(url).pathname
      .replace(/\/+$/, '')
      .toLowerCase();

    const paginas = {
      '': 'Home',
      '/': 'Home',
      '/checkout': 'Checkout',
      '/login': 'Login',
      '/products': 'Products',
      '/view_cart': 'Cart'
    };

    return paginas[caminho] || caminho;
  } catch {
    return url;
  }
}

const paginasAgrupadas = new Map();

for (const analise of ultimaExecucao.analises) {
  const chave = normalizarUrlPagina(analise.url);

  if (!paginasAgrupadas.has(chave)) {
    paginasAgrupadas.set(chave, {
      url: analise.url,
      nome: obterNomePagina(analise.url),
      regras: new Set()
    });
  }

  const pagina = paginasAgrupadas.get(chave);

  for (const violacao of analise.violacoes || []) {
    pagina.regras.add(violacao.id);
  }
}

const rankingPaginas = Array.from(paginasAgrupadas.values())
  .map(pagina => ({
    url: pagina.url,
    nome: pagina.nome,
    regras: pagina.regras.size
  }))
  .sort((a, b) => b.regras - a.regras);

const maiorRanking = Math.max(
  1,
  ...rankingPaginas.map(pagina => pagina.regras)
);

const rankingPaginasHtml = rankingPaginas.map((pagina, indice) => `
  <article class="ranking-item">

    <div class="ranking-info">
      <strong>${indice + 1}º - ${esc(pagina.nome)}</strong>
      <span>${pagina.regras} regras com violações</span>
    </div>

    <div class="ranking-bar-bg">
      <div
        class="ranking-bar"
        style="width:${(pagina.regras / maiorRanking) * 100}%">
      </div>
    </div>

  </article>
`).join('');

// ======================================================
// COMPARAÇÃO RESUMIDA
// ======================================================

const comparacaoHtml = execucaoAnterior
  ? `
    <section class="comparison">

      <article>
        <span>Execução anterior</span>
        <strong>${execucaoAnterior.resumo.regras}</strong>
        <small>${esc(formatarData(execucaoAnterior.data))}</small>
      </article>

      <article>
        <span>Execução mais recente</span>
        <strong>${resumoAtual.regras}</strong>
        <small>${esc(formatarData(ultimaExecucao.data))}</small>
      </article>

      <article>
        <span>Variação de violações</span>

        <strong>
          ${esc(comparar(
            resumoAtual.regras,
            execucaoAnterior.resumo.regras
          ))}
        </strong>

        <small>Comparação entre as duas últimas execuções</small>
      </article>

    </section>
  `
  : '<p>Execute novamente os testes para habilitar a comparação histórica.</p>';

// ======================================================
// DETALHAMENTO COMPLETO DA ÚLTIMA EXECUÇÃO
// ======================================================

const detalhes = ultimaExecucao.analises.flatMap(analise =>
  (analise.violacoes || []).map(violacao => ({
    url: analise.url,
    id: violacao.id,
    impacto: (violacao.impacto || '').toLowerCase(),
    descricao: violacao.descricao,
    documentacao: violacao.documentacao,
    elementos: violacao.elementos || []
  }))
);

const detalhesHtml = detalhes.map(item => {
  const recomendacao = obterRecomendacaoAcessibilidade(item.id);

  return `
    <article class="violation">

      <div class="violation-head">
        <strong>${esc(item.id)}</strong>

        <span class="impact ${esc(item.impacto)}">
          ${esc(item.impacto)}
        </span>
      </div>

      <p>${esc(item.descricao)}</p>

      <p>
        <strong>Página:</strong>
        ${esc(item.url)}
      </p>

      <p>
        <strong>Elementos afetados:</strong>
        ${item.elementos.length}
      </p>

      <div class="recommendation">
        <h3>${esc(recomendacao.titulo)}</h3>

        <p>
          <strong>Recomendação de correção:</strong><br>
          ${esc(recomendacao.recomendacao)}
        </p>

        <p>
          <strong>Critério de aceite:</strong><br>
          ${esc(recomendacao.criterio)}
        </p>

        <p>
          <strong>Referência WCAG:</strong>
          ${esc(recomendacao.wcag)}
        </p>
      </div>

      ${item.documentacao ? `
        <a href="${esc(item.documentacao)}"
           target="_blank"
           rel="noopener noreferrer">
          Consultar documentação Axe
        </a>
      ` : ''}

      ${item.elementos.map(elemento => `
        <details>
          <summary>Ver elemento afetado</summary>

          <p>
            <strong>Seletor:</strong>
            ${esc(normalizarSeletor(elemento.seletor))}
          </p>

          <pre>${esc(elemento.html)}</pre>
          <pre>${esc(elemento.detalhes)}</pre>
        </details>
      `).join('')}

    </article>
  `;
}).join('');

// ======================================================
// HISTÓRICO EM TABELA
// ======================================================

const linhasHistorico = historico.map((execucao, indice) => {
  const anterior = indice > 0
    ? historico[indice - 1]
    : null;

  const variacao = anterior
    ? comparar(
        execucao.resumo.regras,
        anterior.resumo.regras
      )
    : 'Primeira execução';

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

* {
  box-sizing: border-box;
}

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

header h1 {
  margin: 0 0 8px;
  font-size: 26px;
}

header p {
  margin: 6px 0;
  color: #cbd5e1;
}

main {
  max-width: 1250px;
  margin: 30px auto;
  padding: 0 20px;
}

h2 {
  margin-top: 32px;
}

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

.card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.card strong {
  display: block;
  font-size: 30px;
  margin-top: 12px;
}

.card small {
  display: block;
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.card.critical strong {
  color: #dc2626;
}

.card.serious strong {
  color: #d97706;
}

.card.moderate strong {
  color: #2563eb;
}

.card.minor strong {
  color: #64748b;
}

.card.fixed strong {
  color: #16a34a;
}

.panel {
  background: white;
  padding: 22px;
  border-radius: 12px;
  margin-top: 18px;
  overflow-x: auto;
}

.bar-row {
  display: grid;
  grid-template-columns: 150px 1fr 35px;
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

.bar {
  height: 100%;
  border-radius: 10px;
}

.bar.critical {
  background: #dc2626;
}

.bar.serious {
  background: #d97706;
}

.bar.moderate {
  background: #2563eb;
}

.bar.minor {
  background: #64748b;
}

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

.comparison span,
.comparison small {
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
  min-width: 850px;
}

th,
td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

th {
  background: #f8fafc;
}

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

.impact.critical,
.impact.nova {
  color: #dc2626;
}

.impact.serious,
.impact.recorrente {
  color: #d97706;
}

.impact.moderate {
  color: #2563eb;
}

.impact.minor {
  color: #64748b;
}

.impact.corrigida {
  color: #16a34a;
}

pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
}

details {
  margin-top: 14px;
}

summary {
  cursor: pointer;
  color: #1d4ed8;
}

a {
  color: #1d4ed8;
}

footer {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 12px;
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

.recommendation p {
  line-height: 1.6;
}

.evidence {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
  margin-top: 12px;
}

@media (max-width: 600px) {
  header {
    padding: 24px 20px;
  }

  main {
    padding: 0 14px;
  }

  .bar-row {
    grid-template-columns: 110px 1fr 25px;
  }
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

  <section class="cards">
    ${cardsHtml}
  </section>

  <h2>Distribuição das violações</h2>

  <section class="panel">
    ${barrasHtml}
  </section>

  <h2>Comparação entre execuções</h2>

  ${comparacaoHtml}

  <h2>Classificação das violações</h2>

  <section class="cards">
    ${classificacoesHtml}
  </section>

  <h2>Ranking de páginas com mais violações</h2>

  <section class="panel">
    <p>Páginas ordenadas pela quantidade de regras distintas com violações.</p>
    ${rankingPaginasHtml}
  </section>

  <h2>Novas violações</h2>

  ${novasHtml}

  <h2>Violações recorrentes</h2>

  ${recorrentesHtml}

  <h2>Violações corrigidas</h2>

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
          <th>Variação</th>
        </tr>
      </thead>

      <tbody>
        ${linhasHistorico}
      </tbody>
    </table>

  </section>

  <h2>Detalhamento da última execução</h2>

  ${detalhesHtml || '<p>Nenhuma violação encontrada.</p>'}

</main>

<footer>
  Relatório gerado automaticamente pelo Outsera QA Automation.
  <br>
  Histórico consultado em reports/a11y/history.
  <br>
  As ocorrências classificadas como corrigidas não foram encontradas
  na execução atual; isso não substitui a validação funcional da correção.
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
console.log(`[DASHBOARD] Violações críticas: ${resumoAtual.criticas}`);
console.log(`[DASHBOARD] Violações sérias: ${resumoAtual.serias}`);
console.log(`[DASHBOARD] Violações moderadas: ${resumoAtual.moderadas}`);
console.log(`[DASHBOARD] Violações leves: ${resumoAtual.leves}`);

if (execucaoAnterior) {
  console.log('\n[DASHBOARD] Comparação histórica:');
  console.log(`[DASHBOARD] Novas violações: ${novas.length}`);
  console.log(`[DASHBOARD] Recorrentes: ${recorrentes.length}`);
  console.log(`[DASHBOARD] Corrigidas: ${corrigidas.length}`);
} else {
  console.log('\n[DASHBOARD] Ainda não existe execução anterior.');
}

console.log('\n[DASHBOARD] Arquivo gerado:');
console.log(arquivoHtml);
console.log('==========================================\n');
