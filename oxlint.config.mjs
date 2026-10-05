import { defineConfig } from 'oxlint'
import reactHooksJs from 'oxlint-config-react-hooks-js/configs/recommended-latest.json' with { type: 'json' }

// oxlint 1.86 split `react/react-compiler` into one native rule per category, named like the
// eslint-plugin-react-hooks rules. Enable the native twin of every compiler rule the JS plugin runs.
const WITHOUT_NATIVE_TWIN = new Set(['config', 'gating'])
const reactCompilerRules = Object.fromEntries(
  Object.entries(reactHooksJs.rules)
    .map(([name, level]) => [name.replace(/^react-hooks-js\//, ''), level])
    .filter(([name]) => !WITHOUT_NATIVE_TWIN.has(name))
    .map(([name, level]) => [`react/${name}`, level]),
)

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
        ...reactCompilerRules,
      },
    },
    {
      files: ['src/components/PagePresets/denormalize.ts'],
      rules: {
        'oxc/only-used-in-recursion': 'off',
      },
    },
    {
      // Measures the DOM (ResizeObserver): the first width has to be set from the effect.
      files: ['src/hooks/useContainerWidth.ts'],
      rules: {
        'react/set-state-in-effect': 'off',
      },
    },
    {
      files: ['src/components/ui/Tooltip.tsx'],
      rules: {
        // Floating UI assigns positioning refs during render (supported library pattern).
        'react/refs': 'off',
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
        'react/incompatible-library': 'off',
        'react/refs': 'off',
        'react-hooks-js/incompatible-library': 'off',
        'react-hooks-js/refs': 'off',
      },
    },
  ],
})
