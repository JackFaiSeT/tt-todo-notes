import type { DialogOptions } from '@shared/stores/types'

export const EDITOR_DIALOGS = {
  LEAVE: {
    title: 'Уйти из редактора?',
    description: 'Несохранённые правки останутся в черновике.',
    acceptText: 'Уйти',
    declineText: 'Остаться'
  },
  LEAVE_DELETED: {
    title: 'Уйти из редактора?',
    description: 'Заметка удалена. При выходе локальные правки будут потеряны.',
    acceptText: 'Уйти',
    declineText: 'Остаться',
    isDanger: true
  },
  LEAVE_WITH_DRAFT: {
    title: 'Уйти из редактора?',
    description:
      'Прежний черновик останется как есть. Новые правки сохранены в этой вкладке: при следующем открытии заметки здесь их предложат восстановить.',
    acceptText: 'Уйти',
    declineText: 'Остаться'
  },
  OVERWRITE: {
    title: 'Перезаписать заметку?',
    description: 'В другой вкладке сохранена новая версия. Ваши правки заменят её.',
    acceptText: 'Перезаписать',
    declineText: 'Остаться',
    isDanger: true
  },
  DISCARD: {
    title: 'Отменить правки?',
    description: 'Заметка вернётся к последней сохранённой версии, черновик будет удалён.',
    acceptText: 'Отменить правки',
    declineText: 'Оставить',
    isDanger: true
  },
  DELETE: {
    title: 'Удалить заметку?',
    description: 'Заметка и все её пункты будут удалены.',
    acceptText: 'Удалить',
    declineText: 'Оставить',
    isDanger: true
  },
  EXTERNAL_DELETION: {
    title: 'Заметка удалена',
    description: 'Заметку удалили в другой вкладке. Можно сохранить содержимое под новым адресом.',
    acceptText: 'Сохранить как новую',
    declineText: 'К списку'
  }
} as const satisfies Record<string, DialogOptions>

export const DRAFT_OFFER_DIALOG = {
  TITLE: 'Найден несохранённый черновик',
  DESCRIPTION: (date: string, time: string): string => `Последняя правка — ${date}, ${time}.`,
  RULES:
    ' Черновик у заметки один. Он удаляется после сохранения заметки, отмены правок или по кнопке «Удалить черновик». Если отложить решение, черновик останется, а новые правки сохранятся в этой вкладке и переживут перезагрузку страницы.',
  DETAILS_REPLACE: ' Текущие правки будут заменены черновиком.',
  DETAILS_COPY: ' Исходная заметка удалена. Черновик можно открыть как новую заметку.',
  DETAILS_CONFLICT: ' Сохранённая заметка с тех пор изменилась.',
  ACCEPT: 'Восстановить',
  ACCEPT_COPY: 'Восстановить как новую',
  DECLINE: 'Удалить черновик'
} as const
