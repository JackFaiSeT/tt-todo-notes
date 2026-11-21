import { DIALOG_ANSWERS } from '@shared/constants/dialog'
import { SHARED_KEY } from '@shared/constants/store-keys'
import { createStoreId } from '@shared/utils/store-id'
import type { Dialog, DialogAnswer, DialogOptions, ModalsStore } from './types'

export const MODALS_STORE_ID = createStoreId(SHARED_KEY, 'modals')

export const useModalsStore = defineStore(MODALS_STORE_ID, (): ModalsStore => {
  let sequence = 0

  const dialogs = shallowRef<Dialog[]>([])

  const focusedDialogId = shallowRef<number>(0)

  const hasDialogs = computed<boolean>(() => toValue(dialogs).length > 0)

  const isBackgroundInert = computed<boolean>(() =>
    toValue(dialogs).some((dialog) => dialog.id <= toValue(focusedDialogId))
  )

  const choose = (options: DialogOptions): Promise<DialogAnswer> =>
    new Promise<DialogAnswer>((resolve) => {
      const id = ++sequence

      const answer = (result: DialogAnswer): void => {
        dialogs.value = toValue(dialogs).filter((dialog) => dialog.id !== id)
        resolve(result)
      }

      dialogs.value = [...toValue(dialogs), { ...options, id, answer }]
    })

  const confirm = async (options: DialogOptions): Promise<boolean> => (await choose(options)) === DIALOG_ANSWERS.ACCEPT

  const markFocused = (id: number): void => {
    focusedDialogId.value = id
  }

  const dismissAll = (): void => {
    for (const dialog of toValue(dialogs).toReversed()) {
      dialog.answer(DIALOG_ANSWERS.DISMISS)
    }
  }

  return {
    dialogs: shallowReadonly(dialogs),
    focusedDialogId: shallowReadonly(focusedDialogId),
    hasDialogs,
    isBackgroundInert,
    choose,
    confirm,
    markFocused,
    dismissAll
  }
})
