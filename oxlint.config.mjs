import { defineConfig } from 'oxlint'
import reactHooksJs from 'oxlint-config-react-hooks-js/configs/recommended-latest.json' with { type: 'json' }

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
  options: { typeAware: true },
  ignorePatterns: [
    '.agents/**',
    '.cursor/**',
    '.output/**',
    'playwright-report/**',
    'test-results/**',
    'src/routeTree.gen.ts',
  ],
  rules: {
    'typescript/switch-exhaustiveness-check': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'typescript/no-non-null-assertion': 'off',
        'react/rules-of-hooks': 'off',
      },
    },
    {
      files: ['src/**'],
      jsPlugins: [{ name: 'compat', specifier: 'eslint-plugin-compat' }],
      rules: {
        'compat/compat': 'error',
      },
    },
    {
      files: ['**/*.tsx'],
      jsPlugins: [{ name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' }],
      rules: {
        ...reactHooksJs.rules,
        'react/react-compiler': 'error',
      },
    },
    {
      files: ['src/components/PagePresets/denormalize.ts'],
      rules: {
        'oxc/only-used-in-recursion': 'off',
      },
    },
    {
      files: ['src/components/ui/Tooltip.tsx'],
      rules: {
        // Floating UI assigns positioning refs during render (supported library pattern).
        'react/react-compiler': 'off',
        'react-hooks-js/refs': 'off',
      },
    },
    {
      // TanStack Virtual + React Compiler: use `directDomUpdates` for runtime correctness.
      // eslint-plugin-react-hooks still flags useVirtualizer / containerRef until it learns
      // about directDomUpdates (TanStack/virtual#736, react#34493).
      files: [
        'src/components/PagePresets/PresetTable.tsx',
        'src/components/ui/VirtualizedGrid.tsx',
        'src/components/ui/VirtualizedScrollList.tsx',
      ],
      rules: {
        'react/react-compiler': 'off',
        'react-hooks-js/incompatible-library': 'off',
        'react-hooks-js/refs': 'off',
      },
    },
  ],
})
