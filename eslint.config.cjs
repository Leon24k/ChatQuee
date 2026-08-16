module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.env*'],
  },
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
      },
    },
    rules: {
      // Best Practices
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unreachable': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-with': 'error',
      'block-scoped-var': 'error',
      
      // Code Style
      eqeqeq: ['warn', 'always'],
      curly: ['warn', 'all'],
      semi: ['warn', 'always'],
      'no-multi-spaces': 'warn',
      'indent': ['warn', 2],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      
      // Security
      'no-var': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
];