
const { spawnSync } = require('child_process');

const suites = [
  { name: 'Testes Web', script: 'test:web' },
  { name: 'Testes API', script: 'test:api' },
  { name: 'Testes Playwright', script: 'test:playwright' },
  { name: 'Testes de Acessibilidade', script: 'test:a11y' }
];

const reportTasks = [
  { name: 'Relatório Cucumber', script: 'report' },
  { name: 'Dashboard geral', script: 'dashboard' },
  {
    name: 'Dashboard de Acessibilidade',
    script: 'test:a11y:dashboard'
  }
];

const resultados = [];
const resultadosRelatorios = [];

function executarNpm(script) {
  const isWindows = process.platform === 'win32';

  const command = isWindows ? 'cmd.exe' : 'npm';

  const args = isWindows
    ? ['/d', '/s', '/c', `npm run ${script}`]
    : ['run', script];

  return spawnSync(command, args, {
    stdio: 'inherit',
    shell: false
  });
}

function registrarResultado(nome, resultado, destino) {
  const aprovado =
    resultado.status === 0 &&
    !resultado.error &&
    !resultado.signal;

  destino.push({
    nome,
    resultado: aprovado ? 'APROVADO' : 'REPROVADO',
    codigo: resultado.status,
    sinal: resultado.signal || null,
    erro: resultado.error
      ? resultado.error.message
      : null
  });

  if (resultado.error) {
    console.error(
      `[ERRO] ${nome}: ${resultado.error.message}`
    );
  }

  if (resultado.signal) {
    console.error(
      `[ERRO] ${nome}: processo encerrado por ${resultado.signal}`
    );
  }

  if (resultado.status !== 0 && !resultado.error) {
    console.error(
      `[FALHA] ${nome}: código de saída ${resultado.status}`
    );
  }
}

function executarEtapas(etapas, destino, titulo) {
  console.log('\n======================================');
  console.log(` ${titulo}`);
  console.log('======================================\n');

  for (const etapa of etapas) {
    console.log(`\n========== ${etapa.name} ==========\n`);

    try {
      const resultado = executarNpm(etapa.script);

      registrarResultado(
        etapa.name,
        resultado,
        destino
      );
    } catch (erro) {
      console.error(
        `[ERRO] Não foi possível executar ${etapa.name}:`,
        erro.message
      );

      destino.push({
        nome: etapa.name,
        resultado: 'REPROVADO',
        codigo: null,
        sinal: null,
        erro: erro.message
      });
    }
  }
}

function exibirResumo(titulo, resultadosEtapas) {
  console.log('\n======================================');
  console.log(` ${titulo}`);
  console.log('======================================\n');

  for (const item of resultadosEtapas) {
    console.log(`${item.nome}: ${item.resultado}`);

    if (item.codigo !== null && item.codigo !== 0) {
      console.log(`  Código: ${item.codigo}`);
    }

    if (item.erro) {
      console.log(`  Erro: ${item.erro}`);
    }
  }

  const aprovados = resultadosEtapas.filter(
    item => item.resultado === 'APROVADO'
  ).length;

  const reprovados = resultadosEtapas.length - aprovados;

  console.log('\n--------------------------------------');
  console.log(`Total: ${resultadosEtapas.length}`);
  console.log(`Aprovados: ${aprovados}`);
  console.log(`Reprovados: ${reprovados}`);
  console.log('--------------------------------------\n');

  return {
    aprovados,
    reprovados
  };
}

console.log('\n======================================');
console.log(' OUTSERA QA AUTOMATION - TESTE GERAL');
console.log('======================================\n');

// Executa todas as suítes, mesmo quando alguma falha.
executarEtapas(
  suites,
  resultados,
  'EXECUÇÃO DAS SUÍTES'
);

// Tenta gerar os relatórios mesmo quando existem testes reprovados.
executarEtapas(
  reportTasks,
  resultadosRelatorios,
  'GERAÇÃO DOS RELATÓRIOS'
);

// Resumo das suítes.
const resumoSuites = exibirResumo(
  'RESUMO FINAL DAS SUÍTES',
  resultados
);

// Resumo dos relatórios.
const resumoRelatorios = exibirResumo(
  'RESUMO FINAL DOS RELATÓRIOS',
  resultadosRelatorios
);

// Qualquer falha reprova a execução integrada.
const execucaoReprovada =
  resumoSuites.reprovados > 0 ||
  resumoRelatorios.reprovados > 0;

console.log('\n======================================');
console.log(
  execucaoReprovada
    ? ' RESULTADO FINAL: REPROVADO'
    : ' RESULTADO FINAL: APROVADO'
);
console.log('======================================\n');

process.exitCode = execucaoReprovada ? 1 : 0;
