import {
  BrowserChannelProvider,
  ChannelClient,
  NoopChannelProvider,
  type IChannelClient
} from '@shared/services/channel'
import { consoleErrorSink, ErrorReporter, type IErrorReporter } from '@shared/services/error-reporter'
import { HttpClient, nuxtHttpTransport, type IHttpClient } from '@shared/services/http'
import { CryptoIdProvider, IdClient, type IIdClient } from '@shared/services/ids'
import { BrowserPageLifecycle, type IPageLifecycle } from '@shared/services/page-lifecycle'
import { BrowserStorageProvider, StorageClient, type IStorageClient } from '@shared/services/storage'
import { BrowserTimer, SystemClock, TimeClient, type ITimeClient } from '@shared/services/time'
import { NOTES_CHANNEL_NAME, NOTES_KEY, parseChange, type INotesService, type NNotes } from '@notes'
import { NotesAdapter, NotesApi, NotesService } from '@notes/composition'

export type AppServices = {
  [NOTES_KEY]: INotesService
}

export type AppProvisions = {
  services: AppServices
  errorReporter: IErrorReporter
  timeClient: ITimeClient
  idClient: IIdClient
  pageLifecycle: IPageLifecycle
}

type AppPlugin = {
  provide: AppProvisions
}

const createNotesChannel = (): IChannelClient<NNotes.Change> =>
  new ChannelClient<NNotes.Change>(
    typeof BroadcastChannel === 'undefined'
      ? new NoopChannelProvider()
      : new BrowserChannelProvider(new BroadcastChannel(NOTES_CHANNEL_NAME)),
    parseChange
  )

const createStorageClient = (resolveStorage: () => Storage): IStorageClient =>
  new StorageClient(new BrowserStorageProvider(resolveStorage))

type AppServicesDependencies = {
  httpClient: IHttpClient
  channelClient: IChannelClient<NNotes.Change>
}

const createAppServices = ({ httpClient, channelClient }: AppServicesDependencies): AppServices => ({
  [NOTES_KEY]: new NotesService({
    notesApi: new NotesApi(httpClient),
    notesAdapter: new NotesAdapter(),
    channelClient,
    tabStorageClient: createStorageClient(() => sessionStorage),
    deviceStorageClient: createStorageClient(() => localStorage)
  })
})

export default defineNuxtPlugin({
  name: 'services',
  setup: (nuxtApp): AppPlugin => {
    const errorReporter = new ErrorReporter(consoleErrorSink)
    const notesChannel = createNotesChannel()

    nuxtApp.vueApp.onUnmount(() => notesChannel.close())

    return {
      provide: {
        services: createAppServices({
          httpClient: new HttpClient(nuxtHttpTransport, errorReporter),
          channelClient: notesChannel
        }),
        errorReporter,
        timeClient: new TimeClient(new SystemClock(), new BrowserTimer()),
        idClient: new IdClient(new CryptoIdProvider()),
        pageLifecycle: new BrowserPageLifecycle()
      }
    }
  }
})
