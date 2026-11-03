import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const serverDirectory = path.join(projectRoot, '.output', 'server')
const configPath = path.join(serverDirectory, 'wrangler.json')
const wranglerTomlPath = path.join(projectRoot, 'wrangler.toml')
const packageJsonPath = path.join(projectRoot, 'package.json')
const devWorkerScriptPath = path.join(projectRoot, 'scripts', 'dev-worker.mjs')

let config
try {
  config = JSON.parse(await readFile(configPath, 'utf8'))
} catch {
  console.error('Worker release check failed: run the production build before checking Wrangler output.')
  process.exitCode = 1
}

if (config) {
  const problems = []
  const wranglerToml = await readFile(wranglerTomlPath, 'utf8')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  const devWorkerScript = await readFile(devWorkerScriptPath, 'utf8')
  const normalizedDevWorkerScript = devWorkerScript.replace(/\s+/g, ' ')
  const workerEntrypoint = 'server/index.mjs'

  if (/^\s*main\s*=/m.test(wranglerToml)) {
    problems.push('Remove the Wrangler main field; pnpm dev/deploy pass the Nitro entry point explicitly.')
  }

  if (!packageJson.scripts?.dev?.includes('node scripts/dev-worker.mjs')
    || !normalizedDevWorkerScript.includes("const envFilePath = path.join(projectRoot, '.dev.vars')")
    || !normalizedDevWorkerScript.includes('`--env-file=${envFilePath}`')
    || !normalizedDevWorkerScript.includes('args.push(`--env-file=${envFilePath}`)')
    || !normalizedDevWorkerScript.includes("'--cwd', '.output'")
    || !normalizedDevWorkerScript.includes(`'dev', '${workerEntrypoint}'`)
    || !normalizedDevWorkerScript.includes("'--persist-to', '../.wrangler/state'")) {
    problems.push('The local Worker launcher must use the generated config, absolute local vars file, and project D1 persistence directory.')
  }

  if (!packageJson.scripts?.['dev:https:untrusted']?.includes('node scripts/dev-worker.mjs --untrusted-https')
    || !packageJson.scripts?.['dev:http']?.includes('node scripts/dev-worker.mjs --http')) {
    problems.push('The HTTP and untrusted HTTPS scripts must use the shared local Worker launcher.')
  }

  if (!packageJson.scripts?.deploy?.includes(`wrangler --cwd .output --config server/wrangler.json deploy ${workerEntrypoint}`)) {
    problems.push('The deploy script does not use the generated Worker configuration and entry point.')
  }

  if (config.main !== 'index.mjs') {
    problems.push('The generated Worker entry point is not index.mjs.')
  } else {
    try {
      await access(path.join(serverDirectory, config.main))
    } catch {
      problems.push('The generated Worker entry point does not exist.')
    }
  }

  if (config.assets?.binding !== 'ASSETS' || config.assets?.directory !== '../public') {
    problems.push('The generated ASSETS binding does not match the Nuxt public output.')
  } else {
    try {
      await access(path.resolve(serverDirectory, config.assets.directory))
    } catch {
      problems.push('The generated ASSETS directory does not exist.')
    }
  }

  const database = config.d1_databases?.find(binding => binding.binding === 'DB')
  if (
    database?.database_name !== 'kekasih-db'
    || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(database.database_id ?? '')
  ) {
    problems.push('The generated DB binding is missing or does not identify kekasih-db.')
  }

  if (
    typeof config.compatibility_date !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(config.compatibility_date)
    || !config.compatibility_flags?.includes('nodejs_compat')
  ) {
    problems.push('The generated Worker compatibility date or nodejs_compat flag is missing.')
  }

  const cloudName = config.vars?.CLOUDINARY_CLOUD_NAME
  if (typeof cloudName !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(cloudName.trim())) {
    problems.push('Set a valid CLOUDINARY_CLOUD_NAME in the Wrangler vars before deployment.')
  }

  if (problems.length) {
    console.error('Worker release check failed:')
    for (const problem of problems) console.error(`- ${problem}`)
    process.exitCode = 1
  } else {
    console.log('Worker release checks passed.')
  }
}
