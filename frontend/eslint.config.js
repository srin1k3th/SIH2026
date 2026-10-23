import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'scripts/**',
    ],
    rules: {
      'no-unused-vars': 'off', // TypeScript compiler handles this with strict tsconfig
      'no-undef': 'off',
    },
  },
];
