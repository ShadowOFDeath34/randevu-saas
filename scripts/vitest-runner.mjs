import path from 'node:path'
import { startVitest } from 'vitest/node'

const args = process.argv.slice(2)
const filters = []
let coverageEnabled = false

for (const arg of args) {
  if (arg === '--coverage') {
    coverageEnabled = true
    continue
  }

  filters.push(arg)
}

const root = process.cwd()

const ctx = await startVitest(
  'test',
  filters,
  {
    run: true,
    watch: false,
  },
  {
    configFile: false,
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      pool: 'threads',
      fileParallelism: false,
      maxWorkers: 1,
      setupFiles: [path.resolve(root, 'src/test/setup.ts')],
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      coverage: {
        enabled: coverageEnabled,
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
        ],
      },
    },
  }
)

if (ctx?.state?.getCountOfFailedTests?.() > 0) {
  process.exitCode = 1
}
