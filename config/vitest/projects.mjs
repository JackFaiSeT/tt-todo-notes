export const TEST_TIME_ZONE = 'Europe/Moscow'

const TEST_ISOLATION = Object.freeze({
  clearMocks: true,
  restoreMocks: true,
  unstubEnvs: true,
  unstubGlobals: true
})

export const unitTestProject = ({ setupFiles = [] } = {}) => ({
  extends: true,
  test: {
    name: 'unit',
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    setupFiles,
    env: { TZ: TEST_TIME_ZONE },
    ...TEST_ISOLATION
  }
})

export const integrationTestProject = ({ testTimeout, hookTimeout }) => ({
  extends: true,
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.integration.test.ts'],
    environment: 'node',
    env: { TZ: TEST_TIME_ZONE },
    fileParallelism: false,
    testTimeout,
    hookTimeout,
    ...TEST_ISOLATION
  }
})
