import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const nuxtBin = fileURLToPath(new URL('../node_modules/nuxt/bin/nuxt.mjs', import.meta.url))
const result = spawnSync(process.execPath, [nuxtBin, 'build'], {
  env: { ...process.env, NITRO_MINIFY: 'false' },
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}

process.exitCode = result.status ?? 1
