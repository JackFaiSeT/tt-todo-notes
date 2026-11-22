import { describe, expect, it, vi } from 'vitest'
import { toValue } from 'vue'
import { UI_MODAL_INITIAL_FOCUS_ATTRIBUTE, UI_MODAL_ROLES } from '@uikit/components/ui-modal/constants'
import { useLayoutDialog } from '@app/components/layout-modals/components/layout-dialog/composables/useLayoutDialog'
import type { Dialog } from '@shared/stores/types'

const INITIAL = { [UI_MODAL_INITIAL_FOCUS_ATTRIBUTE]: '' }

const createDialog = (flags: Pick<Dialog, 'isDanger' | 'isAcceptDisabled'>): Dialog => ({
  id: 7,
  title: '',
  description: '',
  acceptText: 'Да',
  answer: vi.fn<Dialog['answer']>(),
  ...flags
})

describe('App/useLayoutDialog', () => {
  it.each([
    { isDanger: true, isAcceptDisabled: false, role: UI_MODAL_ROLES.ALERT, decline: INITIAL, accept: {} },
    { isDanger: false, isAcceptDisabled: true, role: UI_MODAL_ROLES.DIALOG, decline: INITIAL, accept: {} },
    { isDanger: false, isAcceptDisabled: false, role: UI_MODAL_ROLES.DIALOG, decline: {}, accept: INITIAL }
  ])(
    'should select a safe initial action when danger is $isDanger and accept is disabled $isAcceptDisabled',
    ({ isDanger, isAcceptDisabled, role, decline, accept }) => {
      const view = useLayoutDialog(
        { dialog: createDialog({ isDanger, isAcceptDisabled }), isInert: false, isTop: true },
        vi.fn<Parameters<typeof useLayoutDialog>[1]>()
      )

      expect(toValue(view.role)).toBe(role)
      expect(toValue(view.declineAttrs)).toEqual(decline)
      expect(toValue(view.acceptAttrs)).toEqual(accept)
    }
  )
})
