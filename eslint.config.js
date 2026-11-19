
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      '.git/**'
    ]
  },

  {
    files: ['**/*.js'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },

    rules: {
      ...js.configs.recommended.rules,

      // Problemas que devem bloquear o Quality Gate
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'valid-typeof': 'error',
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',

      // Avisos de variáveis não utilizadas
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],

      // Logs permitidos na automação
      'no-console': 'off'
    }
  },

  // Globais específicos do K6
  {
    files: ['performance/**/*.js'],

    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
        __ENVIRONMENT: 'readonly'
      }
    }
  },

  // APIs do navegador utilizadas nos testes de acessibilidade
  {
    files: ['helpers/accessibility.js'],

    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
];
