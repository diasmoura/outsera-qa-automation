
const reporter = require('multiple-cucumber-html-reporter');

reporter.generate({
  jsonDir: './reports',
  reportPath: './reports/html',
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
