
const fs = require('fs');
const path = require('path');

const arquivoJson = path.join(__dirname, 'accessibility-report.json');
const arquivoHtml = path.join(__dirname, 'accessibility-report.html');

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

if (!fs.existsSync(arquivoJson)) {
  console.error('[ERRO] Relatório JSON não encontrado:', arquivoJson);
  process.exit(1);
}

let resultados;

try {
  resultados = JSON.parse(fs.readFileSync(arquivoJson, 'utf8'));

  if (!Array.isArray(resultados)) {
    throw new Error('O conteúdo do relatório deve ser um array.');
  }
} catch (error) {
  console.error('[ERRO] Falha ao ler os dados:', error.message);
  process.exit(1);
}

// Normalização dos resultados
resultados = resultados.map((resultado) => {
  const resumo = resultado.resumo || {};
  const violacoes = Array.isArray(resultado.violacoes)
    ? resultado.violacoes
    : [];

  const criticas = numero(resumo.criticas);
  const serias = numero(resumo.serias);

  // Considera todas as severidades registradas.
  const totalViolacoes = violacoes.length;

  const status = totalViolacoes > 0
    ? 'REPROVADO'
    : 'APROVADO';

  return {
    ...resultado,
    resumo: {
      ...resumo,
      criticas,
      serias,
      totalViolacoes,
      resultado: status
    },
    violacoes
  };
});

// Indicadores gerais
const totalAnalises = resultados.length;

const totalCriticas = resultados.reduce(
  (total, item) => total + item.resumo.criticas, 0
);

const totalSerias = resultados.reduce(
  (total, item) => total + item.resumo.serias, 0
);

const totalViolacoes = resultados.reduce(
  (total, item) => total + item.resumo.totalViolacoes, 0
);

const totalAprovadas = resultados.filter(
  item => item.resumo.resultado === 'APROVADO'
).length;

const totalReprovadas = resultados.filter(
  item => item.resumo.resultado === 'REPROVADO'
).length;

// Detalhamento das análises
const secoes = resultados.map((resultado, indice) => {
  const status = resultado.resumo.resultado;
  const classeStatus = status === 'APROVADO'
    ? 'aprovado'
    : 'reprovado';

  const violacoes = resultado.violacoes.map((violacao) => {
    const elementos = (violacao.elementos || [])
      .map((elemento) => {
        const seletor = Array.isArray(elemento.seletor)
          ? elemento.seletor.join(', ')
          : elemento.seletor;

        return `
          <div class="elemento">
            <strong>Seletor:</strong>
            <code>${escapar(seletor || 'Não informado')}</code>

            <strong>HTML encontrado:</strong>
            <pre>${escapar(elemento.html || 'Não informado')}</pre>

            <strong>Detalhes:</strong>
            <pre>${escapar(elemento.detalhes || 'Não informado')}</pre>
          </div>
        `;
      }).join('');

    const impacto = String(violacao.impacto || 'sem-impacto')
      .toLowerCase();

    return `
      <article class="violacao">
        <div class="violacao-header">
          <h3>${escapar(violacao.id || 'Regra não identificada')}</h3>

          <span class="impacto ${escapar(impacto)}">
            ${escapar(impacto)}
          </span>
        </div>

        <p>${escapar(violacao.descricao || 'Sem descrição')}</p>

        <p>
          <a href="${escapar(violacao.documentacao || '#')}"
             target="_blank"
             rel="noopener noreferrer">
            Consultar documentação Axe
          </a>
        </p>

        <p>
          <strong>Elementos afetados:</strong>
          ${(violacao.elementos || []).length}
        </p>

        ${elementos || '<p>Detalhes dos elementos não disponíveis.</p>'}
      </article>
    `;
  }).join('');

  return `
    <section class="analise">
      <div class="analise-header">
        <h2>Análise ${indice + 1}</h2>
        <span class="status ${classeStatus}">
          ${escapar(status)}
        </span>
      </div>

      <p class="url">${escapar(resultado.url)}</p>

      <p>
        <strong>Data:</strong>
        ${escapar(resultado.dataHora || 'Não informada')}
      </p>

      <p>
        <strong>Identificador da execução:</strong>
        ${escapar(resultado.identificadorExecucao || 'Não informado')}
      </p>

      <div class="resumo-analise">
        <span>Regras com violações: ${resultado.resumo.totalViolacoes}</span>
        <span>Críticas: ${resultado.resumo.criticas}</span>
        <span>Sérias: ${resultado.resumo.serias}</span>
      </div>

      ${violacoes || '<p class="sem-violacoes">Nenhuma violação encontrada.</p>'}
    </section>
  `;
}).join('');

// HTML do relatório
const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Relatório de Acessibilidade - Outsera QA</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f4f6f9;
      color: #263238;
      margin: 0;
      padding: 30px;
    }

    .container {
      max-width: 1200px;
      margin: auto;
    }

    h1 {
      color: #17365d;
      margin-bottom: 8px;
    }

    .subtitulo {
      color: #667085;
      margin-bottom: 30px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 15px;
      margin: 25px 0 35px;
    }

    .card {
      background: white;
      padding: 22px;
      border-radius: 10px;
      box-shadow: 0 2px 8px #0001;
      border: 1px solid #eaecf0;
    }

    .card-label {
      color: #667085;
      font-size: 14px;
    }

    .numero {
      display: block;
      font-size: 32px;
      font-weight: bold;
      margin-top: 10px;
      color: #17365d;
    }

    .card.criticas .numero {
      color: #b42318;
    }

    .card.serias .numero {
      color: #d97706;
    }

    .card.aprovadas .numero {
      color: #15803d;
    }

    .card.reprovadas .numero {
      color: #b42318;
    }

    .analise {
      background: white;
      padding: 25px;
      margin: 25px 0;
      border-radius: 10px;
      box-shadow: 0 2px 8px #0001;
      border: 1px solid #eaecf0;
    }

    .analise-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .analise-header h2 {
      color: #17365d;
      margin: 0;
    }

    .url {
      overflow-wrap: anywhere;
      color: #175cd3;
      font-weight: bold;
    }

    .resumo-analise {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 18px 0;
    }

    .resumo-analise span {
      background: #f2f4f7;
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .violacao {
      border: 1px solid #eaecf0;
      padding: 20px;
      margin: 18px 0;
      border-radius: 8px;
      background: #fff;
    }

    .violacao-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .violacao-header h3 {
      color: #344054;
      margin: 0;
    }

    .impacto, .status {
      display: inline-block;
      padding: 7px 12px;
      border-radius: 5px;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .critical {
      background: #b42318;
    }

    .serious {
      background: #d97706;
    }

    .moderate {
      background: #2563eb;
    }

    .minor {
      background: #64748b;
    }

    .sem-impacto {
      background: #667085;
    }

    .reprovado {
      background: #b42318;
    }

    .aprovado {
      background: #15803d;
    }

    .elemento {
      border-top: 1px solid #eaecf0;
      padding: 15px 0;
      margin-top: 12px;
    }

    code, pre {
      display: block;
      background: #f2f4f7;
      padding: 12px;
      border-radius: 5px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-size: 13px;
    }

    a {
      color: #175cd3;
    }

    .sem-violacoes {
      color: #15803d;
      font-weight: bold;
    }

    footer {
      margin-top: 35px;
      padding: 20px 0;
      color: #667085;
      font-size: 13px;
      border-top: 1px solid #ddd;
    }

    @media (max-width: 600px) {
      body {
        padding: 15px;
      }

      .analise {
        padding: 18px;
      }
    }

    @media print {
      body {
        background: white;
        padding: 10px;
      }

      .analise, .card, .violacao {
        box-shadow: none;
        break-inside: avoid;
      }
    }
  </style>
</head>

<body>
  <main class="container">

    <h1>Relatório de Acessibilidade</h1>

    <p class="subtitulo">
      Projeto Outsera QA Automation |
      Análise automatizada com Axe-core e Playwright
    </p>

    <div class="cards">

      <div class="card">
        <span class="card-label">Análises realizadas</span>
        <span class="numero">${totalAnalises}</span>
      </div>

      <div class="card">
        <span class="card-label">Regras com violações</span>
        <span class="numero">${totalViolacoes}</span>
      </div>

      <div class="card criticas">
        <span class="card-label">Violações críticas</span>
        <span class="numero">${totalCriticas}</span>
      </div>

      <div class="card serias">
        <span class="card-label">Violações sérias</span>
        <span class="numero">${totalSerias}</span>
      </div>

      <div class="card aprovadas">
        <span class="card-label">Páginas aprovadas</span>
        <span class="numero">${totalAprovadas}</span>
      </div>

      <div class="card reprovadas">
        <span class="card-label">Páginas reprovadas</span>
        <span class="numero">${totalReprovadas}</span>
      </div>

    </div>

    <h2>Detalhamento das análises</h2>

    ${secoes || '<p>Nenhuma análise registrada.</p>'}

    <footer>
      Relatório gerado automaticamente pelo projeto Outsera QA Automation.
      Ferramentas: Axe-core e Playwright.
    </footer>

  </main>
</body>
</html>
`;

try {
  fs.writeFileSync(arquivoHtml, html, 'utf8');

  console.log('\n[SUCESSO] Relatório HTML gerado.');
  console.log('[ARQUIVO]', arquivoHtml);

  console.log('\n[RESUMO]');
  console.log(`Análises realizadas: ${totalAnalises}`);
  console.log(`Aprovadas: ${totalAprovadas}`);
  console.log(`Reprovadas: ${totalReprovadas}`);
  console.log(`Regras com violações: ${totalViolacoes}`);
  console.log(`Violações críticas: ${totalCriticas}`);
  console.log(`Violações sérias: ${totalSerias}`);
} catch (error) {
  console.error('[ERRO] Não foi possível gerar o HTML:', error.message);
  process.exit(1);
}
