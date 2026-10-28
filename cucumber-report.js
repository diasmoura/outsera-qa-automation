
const fs = require('fs');
const path = require('path');

async function main() {
  const jsonDir = path.resolve(__dirname, 'reports');
  const reportPath = path.resolve(__dirname, 'reports', 'html');

  const jsonFiles = fs.readdirSync(jsonDir)
    .filter(file => file.endsWith('.json'))
    .filter(file => fs.statSync(path.join(jsonDir, file)).isFile());

  if (jsonFiles.length === 0) {
    throw new Error(`Nenhum arquivo JSON encontrado em: ${jsonDir}`);
  }

  console.log('Arquivos JSON encontrados:', jsonFiles);

  const mod = await import('multiple-cucumber-html-reporter');

  mod.generate({
    jsonDir,
    reportPath,
    pageTitle: 'Relatório QA',
    reportName: 'Outsera QA Automation',
    displayDuration: true,
    metadata: {
      browser: {
        name: 'chromium',
        version: 'Playwright'
      },
      device: 'Local',
      platform: {
        name: 'Windows',
        version: '10'
      }
    }
  });

  console.log(`Relatório gerado em: ${reportPath}`);
}

main().catch(error => {
  console.error('Erro ao gerar relatório:', error);
  process.exitCode = 1;
});
