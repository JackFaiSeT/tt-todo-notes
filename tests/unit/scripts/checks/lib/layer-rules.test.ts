import { describe, expect, it } from 'vitest'
import { createLayerRules, findDomainOrderGaps } from '../../../../../scripts/checks/lib/layer-rules.mjs'

const { findImportViolations, isLayeredFile } = createLayerRules(['user', 'appointments'], ['appointments', 'user'])

const NO_VIOLATIONS = {
  placement: [],
  layer: [],
  domain: [],
  order: [],
  app: [],
  server: [],
  data: [],
  barrel: [],
  forbidden: []
}

describe('Scripts/layerRules', () => {
  describe('isLayeredFile', () => {
    it.each([
      { file: 'tests/unit/sample.test.ts' },
      { file: 'scripts/checks/check-layers.mjs' },
      { file: 'nuxt.config.ts' }
    ])('should return false when $file is outside the layers', ({ file }) => {
      expect(isLayeredFile(file)).toBe(false)
    })

    it.each([
      { file: 'src/shared/components/base/base-image/index.vue' },
      { file: 'src/core/user/service.ts' },
      { file: 'src/server/api/health.ts' }
    ])('should return true when $file belongs to a layer', ({ file }) => {
      expect(isLayeredFile(file)).toBe(true)
    })
  })

  describe('findImportViolations', () => {
    it.each([
      ['src/shared/contract/user/ids.ts', '@shared/services/http'],
      ['src/shared/contract/user/ids.ts', '../../services/http'],
      ['src/shared/contract/user/ids.ts', '#server/config'],
      ['src/shared/contract/user/ids.ts', '@app/plugins'],
      ['src/shared/contract/user/ids.ts', '@user/domain'],
      ...['vue', 'pinia', '#app', '#imports', 'h3', 'nuxt/app', 'drizzle-orm/sqlite-core'].map((dependency) => [
        'src/shared/contract/user/ids.ts',
        dependency
      ]),
      ['src/core/user/api.ts', '#imports'],
      ['src/core/user/service.ts', 'vue'],
      ['src/core/user/adapter.ts', 'pinia'],
      ['src/core/user/domain/index.ts', '#app'],
      ['src/core/user/service.ts', '@user/stores/useProfileStore'],
      ['src/core/user/service.ts', './composables'],
      ['src/core/user/api.ts', '@shared/stores/useNotificationsStore'],
      ['src/core/user/adapter.ts', '@shared/composables'],
      ['src/core/user/domain/index.ts', '../composables/useProfile'],
      ['src/core/user/domain/data-contracts.ts', '@appointments/stores/useSlotsStore'],
      ['src/server/modules/user/services/user.service.ts', 'h3'],
      ['src/server/modules/user/dto/user.dto.ts', 'h3']
    ])('should reject the dependency when %s imports %s', (file, specifier) => {
      expect(findImportViolations(file, "import { value } from '" + specifier + "'").forbidden).toEqual([
        { file, specifier }
      ])
    })

    it.each([
      ['src/server/api/notes/get.ts', '#server/modules/notes/repositories/notes.repository'],
      ['src/server/api/notes/get.ts', '../../database/schema'],
      ['src/server/common/context.ts', '../modules/notes'],
      ['src/server/config/index.ts', '../../shared/utils/time'],
      ['src/server/config/index.ts', '@shared/contract/../utils/time'],
      ['src/server/config/index.ts', '@shared/services/channel'],
      ['src/server/config/index.ts', '@base/button'],
      ['src/server/config/index.ts', '@uikit/button'],
      ['src/server/config/index.ts', '@app/plugins'],
      ['src/server/config/index.ts', '@user/constants'],
      ['src/server/config/index.ts', '~/core/user/utils'],
      ['src/app/plugins/sample.ts', '#server/config'],
      ['src/core/user/service.ts', '../../server/database'],
      ['src/shared/utils/time.ts', '~~/src/server/config'],
      ['src/server/database/probe.ts', '#server/modules/notes'],
      ['src/server/database/connection.ts', '../modules/notes/types'],
      ['src/server/modules/notes/services/notes.service.ts', '#server/api/notes/index.get'],
      ['src/server/modules/notes/notes.module.ts', '#server/plugins/app'],
      ['src/server/modules/notes/repositories/notes.repository.ts', '../../../plugins/context'],
      ['src/server/plugins/app.ts', '#server/modules/notes/services/notes.service'],
      ['src/server/plugins/context.d.ts', '../modules/notes/types']
    ])('should report a server boundary violation when %s imports %s', (file, specifier) => {
      expect(findImportViolations(file, `import type { Notes } from '${specifier}'`).server).toEqual([
        { file, specifier }
      ])
    })

    it.each([
      ['src/server/modules/notes/services/notes.service.ts', 'drizzle-orm'],
      ['src/server/modules/notes/services/notes.service.ts', '#server/database/connection'],
      ['src/server/modules/notes/dto/notes.dto.ts', 'drizzle-orm/sqlite-core'],
      ['src/server/modules/notes/providers/note-id-generator.ts', '#server/database/schema.ts'],
      ['src/server/modules/notes/index.ts', '#server/database/schema'],
      ['src/server/common/http/body.ts', 'better-sqlite3'],
      ['src/server/config/index.ts', '../database/connection'],
      ['src/server/api/notes/index.get.ts', 'drizzle-orm'],
      ['src/core/user/composables/useSample.ts', 'drizzle-orm']
    ])('should report a data access violation when %s imports %s', (file, specifier) => {
      expect(findImportViolations(file, `import { db } from '${specifier}'`).data).toEqual([{ file, specifier }])
    })

    it.each([
      ['src/server/modules/notes/repositories/notes.repository.ts', 'drizzle-orm'],
      ['src/server/modules/notes/repositories/notes.repository.ts', '#server/database/schema'],
      ['src/server/modules/notes/notes.module.ts', '#server/database/connection'],
      ['src/server/database/migrations.ts', 'drizzle-orm/migrator'],
      ['src/server/database/connection.ts', './schema'],
      ['src/server/plugins/app.ts', '#server/database/connection'],
      ['src/server/modules/notes/services/notes.service.ts', '#server/database/transactions']
    ])('should allow data access when %s imports %s', (file, specifier) => {
      expect(findImportViolations(file, `import type { Db } from '${specifier}'`)).toEqual(NO_VIOLATIONS)
    })

    it.each([
      'src/app/plugins/sample.ts',
      'src/core/user/api.ts',
      'src/shared/utils/route.ts',
      'src/shared/uikit/button/index.vue',
      'src/shared/components/base/icon/index.vue',
      'src/server/modules/user/service.ts',
      'src/shared/contract/sample.ts'
    ])('should allow domain contract imports when consumed by %s', (file) => {
      expect(findImportViolations(file, "import type { User } from '@shared/contract/user/ids'")).toEqual(NO_VIOLATIONS)
    })

    it('should reject a domain directory when placed in client shared', () => {
      const file = 'src/shared/user/ids.ts'

      expect(findImportViolations(file, '').placement).toEqual([{ file }])
    })

    it('should report a layer violation when uikit imports shared', () => {
      const violations = findImportViolations(
        'src/shared/uikit/ui-button/index.vue',
        "import { toHostList } from '@shared/utils'"
      )

      expect(violations.layer).toEqual([
        {
          file: 'src/shared/uikit/ui-button/index.vue',
          fileLayer: 'uikit',
          specifier: '@shared/utils',
          targetLayer: 'shared'
        }
      ])
    })

    it('should report an import when it reaches into another domain', () => {
      const violations = findImportViolations(
        'src/core/user/service.ts',
        "import { APPOINTMENTS_ENDPOINTS } from '@appointments/configs/endpoints'"
      )

      expect(violations.domain).toEqual([
        { file: 'src/core/user/service.ts', specifier: '@appointments/configs/endpoints', targetDomain: 'appointments' }
      ])
    })

    it('should report an import when a general domain depends on a more specific domain', () => {
      const violations = findImportViolations(
        'src/core/appointments/components/views/slots/composables/useSlots.ts',
        "import { useProfile } from '@user'"
      )

      expect(violations.order).toEqual([
        {
          file: 'src/core/appointments/components/views/slots/composables/useSlots.ts',
          specifier: '@user',
          fileDomain: 'appointments',
          targetDomain: 'user'
        }
      ])
    })

    it.each([
      {
        file: 'src/shared/utils/sample.ts',
        source: "import { startApp } from '@app/utils/startup'",
        targetLayer: 'app',
        label: 'shared imports the app'
      },
      {
        file: 'src/shared/components/base/base-link/index.vue',
        source: "import UiButton from '@uikit/ui-button/index.vue'",
        targetLayer: 'uikit',
        label: 'base imports the ui kit'
      },
      {
        file: 'src/shared/utils/sample.ts',
        source: "import { useProfile } from '../../core/user'",
        targetLayer: 'core',
        label: 'shared reaches a domain through a relative path'
      },
      {
        file: 'src/shared/utils/sample.ts',
        source: "const page = () => import('@app/pages/index.vue')",
        targetLayer: 'app',
        label: 'shared imports the app dynamically'
      }
    ])('should report a layer violation when $label', ({ file, source, targetLayer }) => {
      expect(findImportViolations(file, source).layer).toEqual([
        expect.objectContaining({ file, targetLayer, specifier: expect.any(String) })
      ])
    })

    it.each([
      {
        source: "export type { NAppointments } from '@appointments/domain/data-contracts'",
        label: 'internal domain types'
      },
      { source: "import { useCities } from '../../appointments/composables'", label: 'relative composables' },
      { source: "import { toSlot } from '@appointments/utils/slots'", label: 'utils file outside the utils entry' }
    ])('should report a deep cross-domain import when a domain imports another domain $label', ({ source }) => {
      expect(findImportViolations('src/core/user/composables/useSample.ts', source).domain).toEqual([
        expect.objectContaining({ targetDomain: 'appointments' })
      ])
    })

    it('should allow the import when it uses the public domain entry', () => {
      expect(
        findImportViolations('src/core/user/composables/useProfile.ts', "import { useCities } from '@appointments'")
      ).toEqual(NO_VIOLATIONS)
    })

    it.each(['@appointments/domain', '@appointments/utils/index.ts'])(
      'should accept %s when it exports a framework-free public entry',
      (specifier) => {
        expect(findImportViolations('src/core/user/adapter.ts', `import { toRequest } from '${specifier}'`)).toEqual(
          NO_VIOLATIONS
        )

        expect(
          findImportViolations('src/server/api/sample.ts', `import { toRequest } from '${specifier}'`).server
        ).toEqual([{ file: 'src/server/api/sample.ts', specifier }])
      }
    )

    it.each([
      { specifier: '@user/adapter.ts' },
      { specifier: '@user/domain/data-contracts' },
      { specifier: '@user/configs/profile' },
      { specifier: '@user/domain' },
      { specifier: '@user/utils' },
      { specifier: '@user/stores/useProfileStore' },
      { specifier: '@user/composables' },
      { specifier: '@user/history/edit-history' },
      { specifier: '@user/components/views/profile/index.vue' },
      { specifier: '@user/composition' },
      { specifier: '../../core/user/composition.ts' }
    ])('should reject $specifier when an app imports domain internals', ({ specifier }) => {
      expect(findImportViolations('src/app/pages/sample.vue', `import x from '${specifier}'`).app).toEqual([
        { file: 'src/app/pages/sample.vue', specifier }
      ])
    })

    it.each([
      { file: 'src/app/pages/sample.vue', specifier: '@user' },
      { file: 'src/app/pages/sample.vue', specifier: '@user/index.ts' },
      { file: 'src/app/pages/sample.vue', specifier: '@user/components' },
      { file: 'src/app/pages/sample.vue', specifier: '@user/components/index' },
      { file: 'src/app/plugins/services.ts', specifier: '@user/composition' },
      { file: 'src/app/plugins/services.ts', specifier: '../../core/user/composition.ts' }
    ])('should allow $specifier when $file takes the domain through a public entry', ({ file, specifier }) => {
      expect(findImportViolations(file, `import x from '${specifier}'`)).toEqual(NO_VIOLATIONS)
    })

    it.each([
      { specifier: '@user' },
      { specifier: '@user/index' },
      { specifier: '@user/components/profile/index.vue' }
    ])('should reject $specifier when a server module imports framework-bound code', ({ specifier }) => {
      expect(findImportViolations('src/server/api/sample.ts', `import x from '${specifier}'`).server).toEqual([
        { file: 'src/server/api/sample.ts', specifier }
      ])
    })

    it.each([
      { file: 'src/core/user/index.ts', specifier: './components/profile-card/index.vue' },
      { file: 'src/core/user/index.ts', specifier: './components' },
      { file: 'src/core/user/index.ts', specifier: '@user/components/index' },
      { file: 'src/core/user/domain/index.ts', specifier: '../components/profile-card/index.vue' }
    ])('should report $file when its domain entry re-exports component $specifier', ({ file, specifier }) => {
      expect(findImportViolations(file, `export { default as ProfileCard } from '${specifier}'`).barrel).toEqual([
        { file, specifier }
      ])
    })

    it('should allow component exports when they are types or come from a components barrel', () => {
      expect(
        findImportViolations(
          'src/core/user/index.ts',
          "export type { ProfileCardResult } from './components/profile-card/types'"
        )
      ).toEqual(NO_VIOLATIONS)

      expect(
        findImportViolations(
          'src/core/user/components/index.ts',
          "export { default as ProfileCard } from './profile-card/index.vue'"
        )
      ).toEqual(NO_VIOLATIONS)
    })

    it.each([
      {
        file: 'src/core/user/composables/useSample.ts',
        source: "import { toText } from '@shared/utils/parsers'",
        label: 'a domain imports shared'
      },
      {
        file: 'src/core/user/service.ts',
        source: "import type { IUserApi } from './api'",
        label: 'a domain imports its own module'
      },
      {
        file: 'src/app/pages/sample.vue',
        source: "import { ProfileView } from '@user/components'",
        label: 'the app imports domain components'
      },
      {
        file: 'src/server/api/sample.ts',
        source: "import { createModule } from '#server/modules/user'",
        label: 'the route imports its module entry'
      },
      {
        file: 'src/server/plugins/app.ts',
        source: "import { createModule } from '#server/modules/user'",
        label: 'the plugin imports a module entry'
      },
      {
        file: 'src/server/api/sample.ts',
        source: "import { getQuery } from 'h3'",
        label: 'the route reads the request through h3'
      },
      {
        file: 'src/server/modules/user/errors/index.ts',
        source: "import { ApiError } from '#server/common/errors/api-error'",
        label: 'a module imports common'
      },
      { file: 'src/shared/utils/sample.ts', source: "import { computed } from 'vue'", label: 'a package is imported' },
      {
        file: 'tests/unit/sample.test.ts',
        source: "import { startApp } from '@app/utils/startup'",
        label: 'the file is outside the layers'
      }
    ])('should allow the import when $label', ({ file, source }) => {
      expect(findImportViolations(file, source)).toEqual(NO_VIOLATIONS)
    })
  })

  describe('findDomainOrderGaps', () => {
    it('should report mismatches when domain folders and the declared order disagree', () => {
      expect(findDomainOrderGaps(['user', 'appointments', 'catalog'], ['user', 'news', 'appointments'])).toEqual({
        missing: ['catalog'],
        unknown: ['news']
      })
    })
  })
})
