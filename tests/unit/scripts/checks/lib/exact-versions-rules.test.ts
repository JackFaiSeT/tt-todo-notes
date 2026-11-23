import { describe, expect, it } from 'vitest'
import {
  findVersionMismatches,
  findVersionViolations,
  findWorkspaceVersionViolations
} from '../../../../../scripts/checks/lib/exact-versions-rules.mjs'

const APP_MANIFEST = 'apps/api/package.json'

const PACKAGE_MANIFEST = 'packages/config/package.json'

const WORKSPACE_FILE = 'pnpm-workspace.yaml'

describe('Scripts/exactVersionsRules', () => {
  describe('findVersionViolations', () => {
    it('should reject versions when a caret or tilde permits upgrades', () => {
      const manifest = { dependencies: { fastify: '^5.1.0' }, devDependencies: { vitest: '~5.0.4' } }

      expect(findVersionViolations(manifest, APP_MANIFEST)).toEqual([
        { file: APP_MANIFEST, section: 'dependencies', name: 'fastify', version: '^5.1.0' },
        { file: APP_MANIFEST, section: 'devDependencies', name: 'vitest', version: '~5.0.4' }
      ])
    })

    it('should reject dependency pins when their values are latest or star', () => {
      const manifest = { dependencies: { nuxt: 'latest' }, optionalDependencies: { sharp: '*' } }

      expect(
        findVersionViolations(manifest, APP_MANIFEST).map((violation: { name: unknown }) => violation.name)
      ).toEqual(['nuxt', 'sharp'])
    })

    it.each([
      { version: '1.2', label: 'a partial version' },
      { version: 'workspace:^', label: 'a workspace range' }
    ])('should report the violation when the source contains $label', ({ version }) => {
      expect(findVersionViolations({ dependencies: { pkg: version } }, APP_MANIFEST)).toHaveLength(1)
    })

    it('should reject a peer range when the workspace package is private', () => {
      expect(findVersionViolations({ peerDependencies: { eslint: '^10.12.0' } }, PACKAGE_MANIFEST)).toEqual([
        { file: PACKAGE_MANIFEST, section: 'peerDependencies', name: 'eslint', version: '^10.12.0' }
      ])
    })

    it('should accept a workspace link when it uses the workspace protocol', () => {
      expect(findVersionViolations({ dependencies: { '@example/shared': 'workspace:*' } }, APP_MANIFEST)).toEqual([])
    })

    it('should accept dependency versions when pinned to a release or prerelease', () => {
      const manifest = { dependencies: { nuxt: '4.6.1', prisma: '7.10.0', next: '1.0.0-alpha.1' } }

      expect(findVersionViolations(manifest, APP_MANIFEST)).toEqual([])
    })
  })

  describe('findWorkspaceVersionViolations', () => {
    it('should reject an override when its value is a range', () => {
      const workspace = { overrides: { mysql2: '^3.24.6', 'prisma>mysql2': '3.24.6', 'esbuild@<0.28.1': '>=0.28.1' } }

      expect(findWorkspaceVersionViolations(workspace, WORKSPACE_FILE)).toEqual([
        { file: WORKSPACE_FILE, section: 'overrides', name: 'mysql2', version: '^3.24.6' },
        { file: WORKSPACE_FILE, section: 'overrides', name: 'esbuild@<0.28.1', version: '>=0.28.1' }
      ])
    })

    it('should reject a package extension when it contains a dependency range', () => {
      const workspace = {
        packageExtensions: {
          '@nuxtjs/i18n': { peerDependencies: { nuxt: '^4.6.1' } },
          '@nestjs/platform-fastify@12.1.3': { dependencies: { rxjs: '7.8.2' }, peerDependencies: { rxjs: '7.x' } }
        }
      }

      expect(findWorkspaceVersionViolations(workspace, WORKSPACE_FILE)).toEqual([
        {
          file: WORKSPACE_FILE,
          section: 'packageExtensions › @nuxtjs/i18n › peerDependencies',
          name: 'nuxt',
          version: '^4.6.1'
        },
        {
          file: WORKSPACE_FILE,
          section: 'packageExtensions › @nestjs/platform-fastify@12.1.3 › peerDependencies',
          name: 'rxjs',
          version: '7.x'
        }
      ])
    })

    it('should ignore package settings when they do not declare versions', () => {
      const workspace = {
        packages: ['apps/*'],
        allowBuilds: { esbuild: true },
        auditConfig: { ignoreGhsas: ['GHSA-86w9-cpqp-85rv'] },
        packageExtensions: {
          '@pinia/nuxt': { peerDependencies: { nuxt: '4.6.1' }, peerDependenciesMeta: { nuxt: { optional: true } } }
        }
      }

      expect(findWorkspaceVersionViolations(workspace, WORKSPACE_FILE)).toEqual([])
    })

    it('should accept an override when its value is exact regardless of the selector', () => {
      const workspace = {
        overrides: { 'prisma>mysql2': '3.24.6', 'esbuild@<0.28.1': '0.28.1', '@lhci/cli>uuid': '11.1.1' }
      }

      expect(findWorkspaceVersionViolations(workspace, WORKSPACE_FILE)).toEqual([])
    })

    it('should accept the workspace when no dependency overrides or extensions are present', () => {
      expect(findWorkspaceVersionViolations({}, WORKSPACE_FILE)).toEqual([])
    })
  })

  describe('findVersionMismatches', () => {
    it('should report conflicting pins when manifests declare different versions of a dependency', () => {
      const manifests = [
        { file: APP_MANIFEST, manifest: { devDependencies: { prisma: '7.10.0' } } },
        { file: 'apps/api-maintenance/package.json', manifest: { dependencies: { prisma: '7.11.0' } } }
      ]

      expect(findVersionMismatches(manifests)).toEqual([
        {
          name: 'prisma',
          entries: [
            { file: APP_MANIFEST, section: 'devDependencies', version: '7.10.0' },
            { file: 'apps/api-maintenance/package.json', section: 'dependencies', version: '7.11.0' }
          ]
        }
      ])
    })

    it('should accept dependency pins when manifests share versions or workspace links', () => {
      const manifests = [
        {
          file: APP_MANIFEST,
          manifest: { devDependencies: { prisma: '7.10.0' }, dependencies: { shared: 'workspace:*' } }
        },
        { file: 'apps/api-maintenance/package.json', manifest: { dependencies: { prisma: '7.10.0' } } },
        { file: PACKAGE_MANIFEST, manifest: { devDependencies: { shared: 'workspace:*' } } }
      ]

      expect(findVersionMismatches(manifests)).toEqual([])
    })
  })
})
