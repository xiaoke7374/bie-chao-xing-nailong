import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')
const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' })
if (remote.status !== 0) {
  console.error('缺少 origin remote，请先关联 GitHub 仓库')
  process.exit(1)
}
const remoteUrl = remote.stdout.trim()

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
if (build.status !== 0) process.exit(build.status ?? 1)

const work = mkdtempSync(join(tmpdir(), 'nailong-pages-'))
try {
  cpSync(dist, work, { recursive: true })
  writeFileSync(join(work, '.nojekyll'), '')

  const run = (args) => {
    const r = spawnSync('git', args, { cwd: work, encoding: 'utf8' })
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout)
      process.exit(r.status ?? 1)
    }
    return r
  }

  run(['init'])
  run(['checkout', '-b', 'gh-pages'])
  run(['add', '-A'])
  run(['-c', 'user.name=github-pages', '-c', 'user.email=pages@users.noreply.github.com', 'commit', '-m', 'deploy'])
  run(['remote', 'add', 'origin', remoteUrl])
  run(['push', '-f', 'origin', 'gh-pages'])
  console.log('已推送到 gh-pages')
} finally {
  rmSync(work, { recursive: true, force: true })
}
