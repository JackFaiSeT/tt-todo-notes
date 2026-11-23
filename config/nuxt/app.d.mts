export declare const LAYER_ALIAS_PATHS: Readonly<Record<string, string>>

export type AppAliases = Record<string, string> & {
  '@shared/contract': string
}

export type AppPaths = {
  resolveAppPath: (path: string) => string
  appAliases: Readonly<AppAliases>
}

export declare const createAppPaths: (appRoot: URL) => AppPaths

export type AppLayoutTarget = {
  file: string
  name: string
}

export type AppComponentsTarget = {
  layouts: Record<string, AppLayoutTarget>
  mainComponent?: string | null
  errorComponent?: string | null
}

export type NuxtAppLayout = {
  srcDir: string
  serverDir: string
  dir: {
    public: string
    app: string
    layouts: string
    middleware: string
    pages: string
    plugins: string
  }
  components: {
    dirs: string[]
  }
  imports: {
    scan: boolean
  }
  pages: {
    pattern: string[]
  }
}

export declare const NUXT_APP_LAYOUT: Readonly<NuxtAppLayout>

export declare const resolveAppComponents: (
  resolveAppPath: (path: string) => string
) => (app: AppComponentsTarget) => void

export type NuxtTypeScriptOptions = {
  strict: boolean
  tsConfig: {
    compilerOptions: Record<string, unknown>
  }
}

export declare const NUXT_TYPESCRIPT: Readonly<NuxtTypeScriptOptions>
