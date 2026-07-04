import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

declare const Bun: {
  YAML: {
    parse(input: string): unknown
  }
}

/** Parse `.yaml` / `.yml` imports with Bun's built-in YAML parser (build-time only). */
export function bunYamlPlugin(): Plugin {
  return {
    name: 'bun-yaml',
    enforce: 'pre',
    load(id) {
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
