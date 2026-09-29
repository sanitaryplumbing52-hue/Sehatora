import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'src/lib/api/schema.d.ts', 'next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // API-provided strings must never be injected as HTML.
      'react/no-danger': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
];

export default config;
