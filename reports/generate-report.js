
async function gerarRelatorio() {
  try {
    console.log('[REPORT] Iniciando geração do relatório...');

    const modulo = await import('multiple-cucumber-html-reporter');

    // Compatibilidade com diferentes formatos de exportação
    const report = modulo.default ?? modulo;

    const generate =
      report.generate ??
      modulo.generate ??
      report.default?.generate;

    if (typeof generate !== 'function') {
      throw new Error(
        `Método generate não encontrado. Exportações disponíveis: ${Object.keys(modulo).join(', ')}`
      );
    }

    generate({
      jsonDir: 'reports',
      reportPath: 'reports/html',

      metadata: {
        browser: {
          name: 'chrome',
          version: 'latest'
        },
        device: 'Local',
        platform: {
          name: 'Windows'
        }
      },

      customData: {
        title: 'Outsera QA Automation',
        data: [
          { label: 'Projeto', value: 'Outsera QA Automation' },
          { label: 'Automação', value: 'Playwright + Cucumber' },
          { label: 'Ambiente', value: 'Homologação' }
        ]
      }
    });

    console.log('[REPORT] Relatório HTML gerado com sucesso!');

  } catch (error) {
    console.error('[REPORT] Erro ao gerar relatório:', error.message);
    process.exitCode = 1;
  }
}

gerarRelatorio();
