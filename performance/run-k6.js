const { spawnSync } = require('child_process');

const k6Path = 'C:\\Program Files\\k6\\k6.exe';
const script = process.argv[2];

if (!script) {
  console.error('Informe o script K6 que deseja executar.');
  process.exit(1);
}

const result = spawnSync(k6Path, ['run', script], {
  stdio: 'inherit',
  env: process.env,
  shell: false,
});

if (result.error) {
  console.error('Erro ao executar K6:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);