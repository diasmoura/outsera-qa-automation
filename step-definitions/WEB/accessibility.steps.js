
const { Given, Then } = require('@cucumber/cucumber');

const ProductsPage = require('../../pages/WEB/ProductsPage');

const {
  validarAcessibilidade
} = require('../../helpers/accessibility');

// ==========================================
// VALIDAÇÃO DA PÁGINA
// ==========================================

function validarPagina(page) {
  if (!page) {
    throw new Error(
      '[A11Y] Página do navegador não informada. Verifique os hooks.'
    );
  }

  if (typeof page.isClosed !== 'function') {
    throw new Error(
      '[A11Y] Objeto de página inválido. Esperado um objeto Page do Playwright.'
    );
  }

  if (page.isClosed()) {
    throw new Error(
      '[A11Y] Página do navegador está fechada. Verifique os hooks.'
    );
  }
}

// ==========================================
// VALIDAÇÃO DO RETORNO DO HELPER
// ==========================================

function validarResultado(resumo) {
  if (!resumo || typeof resumo !== 'object') {
    throw new Error(
      '[A11Y] O helper não retornou um resultado válido.'
    );
  }

  if (!resumo.indicadores || typeof resumo.indicadores !== 'object') {
    throw new Error(
      '[A11Y] Indicadores de acessibilidade não encontrados.'
    );
  }

  if (
    !resumo.comparacaoBaseline ||
    typeof resumo.comparacaoBaseline !== 'object'
  ) {
    throw new Error(
      '[A11Y] Comparação com baseline não encontrada.'
    );
  }

  const status = resumo.comparacaoBaseline.status;

  if (!['APROVADO', 'REPROVADO'].includes(status)) {
    throw new Error(
      `[A11Y] Status de comparação inválido: ${status || 'não informado'}.`
    );
  }

  if (
    !Array.isArray(resumo.comparacaoBaseline.novasViolacoes)
  ) {
    throw new Error(
      '[A11Y] Lista de novas violações inválida ou não informada.'
    );
  }

  return resumo;
}

// ==========================================
// NAVEGAÇÃO PARA PRODUTOS
// ==========================================

Given(
  'que acesso a página de produtos',
  async function () {
    validarPagina(this.page);

    try {
      this.productsPage =
        this.productsPage || new ProductsPage(this.page);

      await this.productsPage.ensureProductsPage();

      validarPagina(this.page);

      console.log(
        '\n[A11Y] Página de produtos carregada para análise.'
      );

      console.log(
        `[A11Y] URL atual: ${this.page.url()}`
      );

    } catch (erro) {
      console.error(
        '[A11Y] Erro ao acessar a página de produtos:',
        erro.message
      );

      throw erro;
    }
  }
);

// ==========================================
// EXIBIÇÃO DOS INDICADORES
// ==========================================

function exibirIndicadores(indicadores) {
  console.log('\n========== INDICADORES DE ACESSIBILIDADE ==========');

  console.log(
    `[A11Y] Regras aprovadas: ${indicadores.regrasAprovadas ?? 0}`
  );

  console.log(
    `[A11Y] Regras com violações: ${indicadores.regrasComViolacoes ?? 0}`
  );

  console.log(
    `[A11Y] Elementos afetados: ${indicadores.elementosAfetados ?? 0}`
  );

  console.log(
    `[A11Y] Elementos elegíveis: ${indicadores.elementosElegiveis ?? 0}`
  );

  console.log(
    `[A11Y] Elementos externos excluídos: ${indicadores.elementosExternosExcluidos ?? 0}`
  );

  console.log(
    `[A11Y] Frames de publicidade Google: ${indicadores.framesPublicidadeGoogle ?? 0}`
  );

  console.log(
    `[A11Y] Violações críticas: ${indicadores.critical ?? 0}`
  );

  console.log(
    `[A11Y] Violações sérias: ${indicadores.serious ?? 0}`
  );

  console.log(
    `[A11Y] Violações moderadas: ${indicadores.moderate ?? 0}`
  );

  console.log(
    `[A11Y] Violações leves: ${indicadores.minor ?? 0}`
  );

  console.log(
    `[A11Y] Análises incompletas: ${indicadores.analisesIncompletas ?? 0}`
  );

  console.log(
    '[A11Y] Violações por regra:',
    JSON.stringify(indicadores.violacoesPorRegra || {}, null, 2)
  );
}

// ==========================================
// EXIBIÇÃO DA COMPARAÇÃO COM BASELINE
// ==========================================

function exibirComparacao(comparacao) {
  console.log('\n========== COMPARAÇÃO COM BASELINE ==========');

  console.log(
    `[A11Y] Baseline aplicado: ${comparacao.baselineAplicado ? 'SIM' : 'NÃO'}`
  );

  console.log(
    `[A11Y] Resultado: ${comparacao.status}`
  );

  console.log(
    `[A11Y] Critério: ${comparacao.criterio || 'Não informado'}`
  );

  if (comparacao.novasViolacoes.length > 0) {
    console.error('\n[A11Y] NOVAS VIOLAÇÕES OU REGRESSÕES:');

    for (const violacao of comparacao.novasViolacoes) {
      console.error(
        `[A11Y] Regra: ${violacao.regra}`
      );

      console.error(
        `[A11Y] Baseline: ${violacao.quantidadeBaseline}`
      );

      console.error(
        `[A11Y] Atual: ${violacao.quantidadeAtual}`
      );

      console.error(
        `[A11Y] Diferença: +${violacao.diferenca}`
      );
    }
  }

  if (
    Array.isArray(comparacao.violacoesConhecidas) &&
    comparacao.violacoesConhecidas.length > 0
  ) {
    console.warn(
      '\n[A11Y] Violações já registradas no baseline:'
    );

    console.warn(
      JSON.stringify(
        comparacao.violacoesConhecidas,
        null,
        2
      )
    );
  }

  if (
    Array.isArray(comparacao.elementosExternosExcluidos) &&
    comparacao.elementosExternosExcluidos.length > 0
  ) {
    console.log(
      `\n[A11Y] Elementos externos excluídos: ${comparacao.elementosExternosExcluidos.length}`
    );
  }
}

// ==========================================
// EXECUÇÃO DA ANÁLISE
// ==========================================

async function executarValidacaoAcessibilidade(page) {
  validarPagina(page);

  console.log('\n==========================================');
  console.log('[A11Y] INICIANDO ANÁLISE DE ACESSIBILIDADE');
  console.log('==========================================');

  console.log(`[A11Y] URL analisada: ${page.url()}`);

  let resumo;

  try {
    resumo = await validarAcessibilidade(page);
  } catch (erro) {
    console.error(
      '\n[A11Y] Falha durante a execução da análise:',
      erro.message
    );

    throw erro;
  }

  // ========================================
  // VALIDAR RESULTADO
  // ========================================

  validarResultado(resumo);

  const indicadores = resumo.indicadores;
  const comparacao = resumo.comparacaoBaseline;

  // ========================================
  // EXIBIR RESULTADO
  // ========================================

  console.log('\n==========================================');
  console.log('[A11Y] RESULTADO DA ANÁLISE');
  console.log('==========================================');

  console.log(`[A11Y] URL: ${resumo.url || page.url()}`);

  console.log(
    `[A11Y] Data: ${resumo.dataAnalise || 'Não informada'}`
  );

  console.log(
    `[A11Y] Resultado bruto do Axe: ${resumo.statusAxe || 'Não informado'}`
  );

  console.log(
    `[A11Y] Resultado da comparação: ${comparacao.status}`
  );

  exibirIndicadores(indicadores);

  exibirComparacao(comparacao);

  // ========================================
  // VALIDAR RESULTADO DA COMPARAÇÃO
  // ========================================

  if (comparacao.status === 'REPROVADO') {
    console.error(
      '\n[A11Y] CENÁRIO REPROVADO: foram identificadas novas violações ou regressões.'
    );

    console.error(
      '[A11Y] Consulte o histórico JSON para analisar os elementos afetados.'
    );

    throw new Error(
      '[A11Y] Cenário reprovado: foram identificadas novas violações ou regressões.'
    );
  }

  // ========================================
  // CENÁRIO APROVADO
  // ========================================

  if (comparacao.status === 'APROVADO') {
    if (comparacao.violacoesConhecidas.length > 0) {
      console.warn(
        '\n[A11Y] Existem violações conhecidas registradas no baseline.'
      );

      console.log(
        '[A11Y] APROVADO: nenhuma regressão em relação ao baseline.'
      );

      return resumo;
    }

    console.log(
      '\n[A11Y] APROVADO: nenhuma violação elegível identificada.'
    );

    return resumo;
  }
}

// ==========================================
// ETAPAS GHERKIN
// ==========================================

Then(
  'a página deve atender aos critérios de acessibilidade',
  async function () {
    await executarValidacaoAcessibilidade(this.page);
  }
);

Then(
  'a página deve ser analisada quanto à acessibilidade',
  async function () {
    await executarValidacaoAcessibilidade(this.page);
  }
);
