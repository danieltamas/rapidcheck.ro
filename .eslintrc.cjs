/**
 * Root ESLint configuration for RapidCheck.ro.
 *
 * Cross-package boundaries are enforced via overrides:
 *   - packages/core/**: no DOM, no chrome.*, no browser.*
 *   - packages/extension/**: chrome.* and browser.* allowed (only place)
 *
 * Custom invariant rules (no eval, no Function, no innerHTML with rule-pack data,
 * no string-based timers) are scaffolded here but kept minimal in this task —
 * the full lint rule set lands as a follow-up.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-restricted-globals': [
      'error',
      { name: 'eval', message: 'Forbidden by invariant 3 (no remote code execution).' },
      { name: 'Function', message: 'Forbidden by invariant 3 (no remote code execution).' },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "CallExpression[callee.name='setTimeout'][arguments.0.type='Literal']",
        message: 'String-based setTimeout is forbidden (invariant 3).',
      },
      {
        selector:
          "CallExpression[callee.name='setInterval'][arguments.0.type='Literal']",
        message: 'String-based setInterval is forbidden (invariant 3).',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  overrides: [
    {
      files: ['packages/core/**/*.ts', 'packages/directory/**/*.ts'],
      rules: {
        'no-restricted-globals': [
          'error',
          { name: 'chrome', message: 'chrome.* is only allowed in packages/extension.' },
          { name: 'browser', message: 'browser.* is only allowed in packages/extension.' },
          { name: 'eval', message: 'Forbidden by invariant 3.' },
          { name: 'Function', message: 'Forbidden by invariant 3.' },
        ],
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', 'packages/*/tests/**/*.ts'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['scripts/**/*.ts', 'packages/extension/vite.config.ts'],
      env: { node: true },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'out',
    '.cache',
    '.vite',
    'packages/*/dist',
    'graphify-out',
  ],
};
