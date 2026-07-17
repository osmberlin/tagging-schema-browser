import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

declare const Bun: {
  YAML: {
    parse(input: string): unknown
  }
}

/** Minimal YAML loader for unit tests (matches vite/bunYamlPlugin.ts). */
function bunYamlPlugin() {
  return {
    name: 'bun-yaml',
    enforce: 'pre' as const,
    load(id: string) {
      if (id.includes('?')) return
      if (!id.endsWith('.yaml') && !id.endsWith('.yml')) return

      const source = readFileSync(id, 'utf-8')
      const data = Bun.YAML.parse(source)
      return {
        code: `export default ${JSON.stringify(data)}`,
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [bunYamlPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '.github/**/*.test.ts'],
  },
})
