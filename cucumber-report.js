
const fs = require('fs');
const path = require('path');

async function generateReport() {
  try {
    console.log('[REPORT] Iniciando relatório consolidado...');

    const module = await import('multiple-cucumber-html-reporter');
    const reporter = module.default || module;

    const reportsDir = path.join(__dirname, 'reports');
    const consolidatedDir = path.join(reportsDir, 'consolidated');
    const htmlDir = path.join(reportsDir, 'html');

    const sources = [
      path.join(reportsDir, 'web', 'cucumber-web-report.json'),
      path.join(reportsDir, 'api', 'cucumber-api-report.json'),
      path.join(reportsDir, 'cucumber-web-report.json'),
      path.join(reportsDir, 'cucumber-api-report.json')
    ];

    const availableFiles = sources.filter(file => fs.existsSync(file));

    if (availableFiles.length === 0) {
      throw new Error('Nenhum JSON do Cucumber foi encontrado.');
    }

    fs.rmSync(consolidatedDir, { recursive: true, force: true });
    fs.mkdirSync(consolidatedDir, { recursive: true });

    for (const source of availableFiles) {
      const json = JSON.parse(fs.readFileSync(source, 'utf8'));

      if (!Array.isArray(json)) {
        throw new Error(`Formato inválido: ${source}`);
      }

      const destination = path.join(
        consolidatedDir,
        `${path.basename(path.dirname(source))}-${path.basename(source)}`
      );

      fs.writeFileSync(destination, JSON.stringify(json, null, 2));
    }

    fs.rmSync(htmlDir, { recursive: true, force: true });
    fs.mkdirSync(htmlDir, { recursive: true });

    await reporter.generate({
      jsonDir: consolidatedDir,
      reportPath: htmlDir,
      openReportInBrowser: false,
      disableLog: true,
      pageTitle: 'Outsera QA Automation',
      reportName: 'Relatório Consolidado - Web e API',
      displayDuration: true,
      metadata: {
        browser: {
          name: 'Chromium',
          version: 'Playwright'
        },
        device: 'Automação',
        platform: {
          name: process.platform
        }
      }
    });

    console.log('[REPORT] Relatório HTML gerado com sucesso!');
    console.log(`[REPORT] Arquivos processados: ${availableFiles.length}`);
    console.log(`[REPORT] Local: ${htmlDir}`);

  } catch (error) {
    console.error('[REPORT] Falha ao gerar relatório:', error);
    process.exitCode = 1;
  }
}

generateReport();
