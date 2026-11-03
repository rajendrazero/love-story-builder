import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const wranglerCli = path.join(projectRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const envFilePath = path.join(projectRoot, '.dev.vars')
const launchMode = process.argv[2] ?? 'https'
const modes = {
  '--http': { protocol: 'http' },
  '--untrusted-https': { protocol: 'https' },
  https: { protocol: 'https', trustedCertificate: true },
}
const mode = modes[launchMode]

if (!mode) {
  console.error(`Unsupported local Worker mode: ${launchMode}`)
  process.exit(1)
}

const args = [
  '--cwd',
  '.output',
  '--config',
  'server/wrangler.json',
  'dev',
  'server/index.mjs',
  '--port',
  '8787',
  '--persist-to',
  '../.wrangler/state',
  '--local-protocol',
  mode.protocol,
]

if (mode.trustedCertificate) {
  args.push(
    '--https-key-path',
    '../.certs/localhost-key.pem',
    '--https-cert-path',
    '../.certs/localhost.pem',
  )
}

args.push(`--env-file=${envFilePath}`)

const worker = spawn(process.execPath, [wranglerCli, ...args], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
})

worker.on('error', (error) => {
  console.error('Failed to launch the local Worker.', error)
  process.exitCode = 1
})

worker.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
