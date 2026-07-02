import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { transformSync } from '@babel/core'
import { describe, expect, it } from 'vitest'

const COMPILER_FIXTURE = `import { useState } from 'react'

export function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
`

describe('react compiler', () => {
  it('transforms components with memo-cache slots', () => {
    const result = transformSync(COMPILER_FIXTURE, {
      filename: 'Counter.tsx',
      parserOpts: { plugins: ['typescript', 'jsx'] },
      plugins: [['babel-plugin-react-compiler', {}]],
    })

    expect(result?.code).toMatch(/compiler-runtime|memo_cache_sentinel/)
  })

  it('lint flags refs written during render', () => {
    const dir = mkdtempSync(join(tmpdir(), 'react-compiler-lint-'))
    const file = join(dir, 'Bad.tsx')
    writeFileSync(
      file,
      `import { useRef } from 'react'

export function Bad() {
  const ref = useRef<HTMLDivElement>(null)
  ref.current = document.createElement('div')
  return <div ref={ref} />
}
`,
    )

    expect(() =>
      execSync(`bunx oxlint --deny-warnings -c oxlint.config.mjs ${file}`, {
        stdio: 'pipe',
      }),
    ).toThrow()
  })
})
