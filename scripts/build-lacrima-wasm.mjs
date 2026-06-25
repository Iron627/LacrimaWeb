import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lacrimaRepo = process.env.LACRIMA_REPO || 'https://github.com/iron627/lacrima'
const sourceDir = resolve(root, process.env.LACRIMA_SOURCE_DIR || '.cache/lacrima')
const adapterSource = join(root, 'tools/lacrima-wasm/main.go')
const adapterTargetDir = join(sourceDir, 'cmd/lacrima-wasm')
const adapterTarget = join(adapterTargetDir, 'main.go')
const assetDir = join(root, 'public/engines/lacrima')

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options })
}

if (!existsSync(sourceDir)) {
  mkdirSync(dirname(sourceDir), { recursive: true })
  run('git', ['clone', lacrimaRepo, sourceDir])
} else if (existsSync(join(sourceDir, '.git'))) {
  run('git', ['-C', sourceDir, 'fetch', '--depth=1', 'origin'])
  run('git', ['-C', sourceDir, 'pull', '--ff-only'])
}

mkdirSync(adapterTargetDir, { recursive: true })
copyFileSync(adapterSource, adapterTarget)
mkdirSync(assetDir, { recursive: true })

run('go', ['build', '-C', sourceDir, '-o', join(assetDir, 'lacrima.wasm'), './cmd/lacrima-wasm'], {
  env: {
    ...process.env,
    GOOS: 'js',
    GOARCH: 'wasm',
  },
})

const goRoot = execFileSync('go', ['env', 'GOROOT'], { encoding: 'utf8' }).trim()
copyFileSync(join(goRoot, 'lib/wasm/wasm_exec.js'), join(assetDir, 'wasm_exec.js'))

console.log(`Built Lacrima WASM assets in ${assetDir}`)
