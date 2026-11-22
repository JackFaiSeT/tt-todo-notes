import type { TestProjectInlineConfiguration } from 'vitest/config'

export declare const TEST_TIME_ZONE: string

export type IntegrationTestTimeouts = {
  testTimeout: number
  hookTimeout: number
}

export type UnitTestOptions = {
  setupFiles?: string[]
}

export declare const unitTestProject: (options?: UnitTestOptions) => TestProjectInlineConfiguration

export declare const integrationTestProject: (timeouts: IntegrationTestTimeouts) => TestProjectInlineConfiguration
