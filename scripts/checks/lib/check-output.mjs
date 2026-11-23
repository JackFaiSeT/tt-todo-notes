import { argv, exit } from 'node:process'

export const QUIET_FLAG = '--quiet'

export const failCheck = (title, lines, hints = []) => {
  console.error(`${title}: ${lines.length}`)

  for (const line of lines) {
    console.error(`  ${line}`)
  }

  for (const hint of hints) {
    console.error(hint)
  }

  exit(1)
}

export const passCheck = (message) => {
  if (!argv.includes(QUIET_FLAG)) {
    console.log(message)
  }
}
