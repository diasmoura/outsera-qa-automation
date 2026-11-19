
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
      '[A11Y] Erro: a página do navegador não foi informada. Verifique os hooks.'
    );
  }

  if (page.isClosed()) {
    throw new Error(
      '[A11Y] Erro: a página está fechada. Verifique os hooks.'
    );
  }
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
        '[A11Y] Página de produtos carregada para análise.'
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
// EXECUÇÃO DA ANÁLISE
// ==========================================

async function executarValidacaoAcessibilidade(page) {
  validarPagina(page);

  let resumo;

  try {
    console.log('\n==========================================');
    console.log('[A11Y] INICIANDO ANÁLISE DE ACESSIBILIDADE');
    console.log('==========================================');

    console.log(`[A11Y] URL analisada: ${page.url()}`);

    resumo = await validarAcessibilidade(page);

  } catch (erro) {
    console.error(
      '[A11Y] Erro técnico durante a análise:',
      erro.message
    );

    throw erro;
  }

  // ========================================
  // VALIDAR RETORNO DO HELPER
  // ========================================

  if (!resumo || typeof resumo !== 'object') {
    throw new Error(
      '[A11Y] O helper não retornou um resultado válido.'
    );
  }

  if (!resumo.indicadores) {
    throw new Error(
      '[A11Y] A análise não retornou os indicadores esperados.'
    );
  }

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
    `[A11Y] Status Axe: ${resumo.statusAxe || 'Não informado'}`
  );

  console.log(
    `[A11Y] Status da validação: ${resumo.status || 'Não informado'}`
  );

  console.log(
    '[A11Y] Indicadores:',
    JSON.stringify(indicadores, null, 2)
  );

  if (comparacao) {
    console.log(
      '[A11Y] Comparação com baseline:',
      JSON.stringify(comparacao, null, 2)
    );
  }

  console.log('==========================================\n');

  // ========================================
  // VALIDAR BASELINE
  // ========================================

  if (!comparacao || !comparacao.status) {
    throw new Error(
      '[A11Y] Comparação com baseline não encontrada. Verifique helpers/accessibility.js.'
    );
  }

  // ========================================
  // CENÁRIO REPROVADO
  // ========================================

  if (comparacao.status === 'REPROVADO') {
    console.error(
      '[A11Y] REPROVADO: foram identificadas regressões de acessibilidade.'
    );

    if (
      Array.isArray(comparacao.novasViolacoes) &&
      comparacao.novasViolacoes.length > 0
    ) {
      console.error(
        '[A11Y] Novas violações:',
        JSON.stringify(
          comparacao.novasViolacoes,
          null,
          2
        )
      );
    }

    console.error(
      '[A11Y] Consulte o histórico JSON e o dashboard para visualizar as evidências.'
    );

    throw new Error(
      '[A11Y] Cenário reprovado: foram identificadas novas violações ou regressões.'
    );
  }

  // ========================================
  // CENÁRIO APROVADO
  // ========================================

  if (comparacao.status === 'APROVADO') {
    if (
      Array.isArray(comparacao.violacoesConhecidas) &&
      comparacao.violacoesConhecidas.length > 0
    ) {
      console.warn(
        '[A11Y] Existem violações já registradas no baseline.'
      );

      console.warn(
        '[A11Y] Violações conhecidas:',
        JSON.stringify(
          comparacao.violacoesConhecidas,
          null,
          2
        )
      );

      console.log(
        '[A11Y] APROVADO: nenhuma regressão em relação ao baseline.'
      );

      return;
    }

    console.log(
      '[A11Y] APROVADO: nenhuma violação identificada.'
    );

    return;
  }

  // ========================================
  // STATUS INVÁLIDO
  // ========================================

  throw new Error(
    `[A11Y] Status de comparação inválido: ${comparacao.status}.`
  );
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
