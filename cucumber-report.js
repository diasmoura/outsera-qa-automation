
const path = require('path');
const fs = require('fs');

async function generateCucumberReport() {
  try {
    const reporter = await import('multiple-cucumber-html-reporter');

    const jsonDir = path.resolve(__dirname, 'reports');
    const reportPath = path.resolve(__dirname, 'reports/html');
    const jsonFile = path.join(jsonDir, 'cucumber-report.json');

    if (!fs.existsSync(jsonFile)) {
      throw new Error('Arquivo cucumber-report.json não encontrado.');
    }

    fs.mkdirSync(reportPath, { recursive: true });

    await reporter.generate({
      jsonDir,
      reportPath,
      pageTitle: 'Relatório de Automação QA',
      reportName: 'Outsera QA Automation',
      displayDuration: true,
      metadata: {
        browser: {
          name: 'API',
          version: 'Playwright'
        },
        device: 'Local',
        platform: {
          name: 'Windows',
          version: '10/11'
        }
      }
    });

    console.log('Relatório HTML gerado com sucesso!');
    console.log(`Local: ${reportPath}`);

  } catch (error) {
    console.error('Erro ao gerar relatório Cucumber:');
    console.error(error);
    process.exitCode = 1;
  }
}

generateCucumberReport();
