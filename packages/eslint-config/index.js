module.exports = {
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/jest'),
  ],
  env: {
    jest: true,
  },
  rules: {
    'jest/no-deprecated-functions': 'off',
  },
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['*.config.js', 'dist/'],
};
