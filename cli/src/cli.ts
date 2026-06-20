import { defineCommand, runMain } from 'citty'
import { docsCommand } from './commands/docs.ts'
import { loginCommand } from './commands/login.ts'
import { logoutCommand } from './commands/logout.ts'
import { openCommand } from './commands/open.ts'
import { listCommand, rmCommand, statusCommand } from './commands/prs.ts'
import { uploadCommand } from './commands/upload.ts'
import { whoamiCommand } from './commands/whoami.ts'
import { error } from './output.ts'

const main = defineCommand({
  meta: {
    name: 'ape-pr',
    version: '0.1.0',
    description: [
      'Upload a pull request — diff, description, images — and review it on a',
      'beautiful surface: https://pr.openape.ai/prs/<id>. Poll the verdict back',
      'with `ape-pr status <slug>`.',
      '',
      'First time? `apes login <email>` once on this device. ape-pr uses the',
      'unified apes session — same login covers ape-tasks, ape-plans and any',
      'other OpenApe CLI. Manifest format: `ape-pr docs manifest`.',
      'Agent reference: `ape-pr docs agent`.',
    ].join('\n'),
  },
  subCommands: {
    upload: uploadCommand,
    status: statusCommand,
    list: listCommand,
    open: openCommand,
    rm: rmCommand,
    whoami: whoamiCommand,
    login: loginCommand,
    logout: logoutCommand,
    docs: docsCommand,
  },
})

process.on('unhandledRejection', (err: unknown) => {
  handleError(err)
  process.exit(1)
})

try {
  await runMain(main)
}
catch (err) {
  handleError(err)
  process.exit(1)
}

function handleError(err: unknown): void {
  if (err && typeof err === 'object') {
    const e = err as { title?: string, detail?: string, message?: string, status?: number }
    const header = e.title ?? e.message ?? 'Unknown error'
    error(e.status ? `${header} (${e.status})` : header)
    if (e.detail) error(e.detail)
    return
  }
  error(String(err))
}
