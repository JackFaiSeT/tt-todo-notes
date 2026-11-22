import { vi } from 'vitest'

const VIEWPORT_WIDTH = 1280

const SCROLLBAR_WIDTH = 15

export const stubDocumentRoot = () => {
  const root = { clientWidth: VIEWPORT_WIDTH - SCROLLBAR_WIDTH, style: { overflow: '', paddingRight: '' } }

  vi.stubGlobal('document', { documentElement: root })
  vi.stubGlobal('window', { innerWidth: VIEWPORT_WIDTH })

  return root
}
