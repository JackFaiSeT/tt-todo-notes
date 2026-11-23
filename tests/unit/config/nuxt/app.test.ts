import { describe, it, expect } from 'vitest'
import { resolveAppComponents } from '../../../../config/nuxt/app.mjs'

describe('Config/nuxtLayout', () => {
  it('should register only layout entries when sibling helpers are scanned', () => {
    const app = {
      layouts: {
        default: { name: 'default', file: 'src/app/layouts/default/index.vue' },
        types: { name: 'types', file: 'src/app/layouts/default/types/index.ts' },
        helper: { name: 'helper', file: 'src/app/layouts/default/composables/useDefaultLayout.ts' }
      }
    }

    resolveAppComponents((path) => path)(app)
    expect(Object.keys(app.layouts)).toEqual(['default'])
  })
})
