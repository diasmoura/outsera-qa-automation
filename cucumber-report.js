
const fs = require('fs');
const path = require('path');

async function generateReport() {
  const reporterModule = await import('multiple-cucumber-html-reporter');
  const reporter = reporterModule.default || reporterModule;

  const reportsDir = path.join(__dirname, 'reports', 'bdd');
  const jsonFile = path.join(reportsDir, 'cucumber-report.json');
  const htmlDir = path.join(__dirname, 'reports', 'html');

  if (!fs.existsSync(jsonFile)) {
    console.error('Arquivo cucumber-report.json não encontrado.');
    console.error('Execute primeiro: npm run test:bdd');
    process.exit(1);
  }

  fs.rmSync(htmlDir, { recursive: true, force: true });
  fs.mkdirSync(htmlDir, { recursive: true });

  reporter.generate({
    jsonDir: reportsDir,
    reportPath: htmlDir,
    openReportInBrowser: false,
    disableLog: true,
    pageTitle: 'Outsera QA Automation',
    reportName: 'Relatório de Automação BDD',
    displayDuration: true,
    metadata: {
      browser: {
        name: 'Chrome',
        version: '156'
      },
      device: 'Máquina local',
      platform: {
        name: 'Windows',
        version: '10/11'
      }
    }
  });

  console.log('Relatório HTML gerado com sucesso!');
  console.log(`Local: ${htmlDir}`);
}

generateReport().catch(error => {
  console.error('Erro ao gerar relatório:', error);
  process.exit(1);
});
