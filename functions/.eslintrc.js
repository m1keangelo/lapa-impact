module.exports = {
  root: true,
  env: { es2020: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['lib/', 'node_modules/'],
  rules: {
    quotes: 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
