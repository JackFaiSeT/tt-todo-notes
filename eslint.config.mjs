import { defineRepoConfig } from './config/eslint/base.mjs'
import { contractConfigs } from './config/eslint/contract.mjs'
import { createVueConfig } from './config/eslint/vue.mjs'

const rootDir = import.meta.dirname

export default defineRepoConfig({ rootDir }, ...createVueConfig({ rootDir }), ...contractConfigs)
