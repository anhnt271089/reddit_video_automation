module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
  },
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        'no-unused-vars': 'off', // Turn off base rule
        'no-undef': 'off', // TypeScript handles this
      },
    },
    
    // Frontend-specific rules
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      env: {
        browser: true,
        es2022: true,
      },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'no-console': 'warn',
      },
    },
    
    // Backend-specific rules
    {
      files: ['apps/server/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    
    // Test files
    {
      files: ['**/*.test.{ts,tsx}'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    
    // Scripts and tools
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};