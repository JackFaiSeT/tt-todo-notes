import { randomUUID } from 'node:crypto'
import { HTTP_STATUS } from '@shared/contract/http'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { uniqueTitle, expect, test, noteEndpoint, draftEndpoint, failDraftWrites, isDraftWrite } from '@e2e/fixtures'
import { NOTE_ROUTES } from '@notes/constants/routes'

test.describe('Notes/Editor', () => {
  test('should offer a path back to the list when the note is missing', async ({ page, consoleGuard }) => {
    const id = parseNoteId(randomUUID())

    consoleGuard.allowHttpError(noteEndpoint(id), HTTP_STATUS.NOT_FOUND)
    await page.goto(NOTE_ROUTES.ITEM(id))
    await expect(page.getByRole('heading', { name: 'Заметка не найдена' })).toBeVisible()
    await expect(page).toHaveTitle(/^Заметка не найдена · /u)
    await page.getByRole('link', { name: 'К списку заметок', exact: true }).click()
    await expect(page).toHaveURL(ROUTE_PATHS.HOME)
    await expect(page.getByRole('main')).toBeFocused()
  })

  test('should retain local edits when navigation is declined', async ({ page, createNote }) => {
    const id = await createNote(uniqueTitle('До перехода'))
    const edited = uniqueTitle('После правки')

    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill(edited)
    await page.getByRole('link', { name: 'Заметки', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Остаться' }).click()
    await expect(page).toHaveURL(NOTE_ROUTES.ITEM(id))
    await expect(field).toHaveValue(edited)
  })

  test('should move focus to the content without a leave prompt when the skip link is used', async ({
    page,
    createNote
  }) => {
    const id = await createNote(uniqueTitle('Пропуск'))

    await page.goto(NOTE_ROUTES.ITEM(id))
    await page.getByLabel('Название', { exact: true }).fill(uniqueTitle('Правка'))
    await page.getByRole('link', { name: 'Перейти к содержимому' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(NOTE_ROUTES.ITEM(id))
  })

  test('should close an open dialog and keep the note when the browser goes back', async ({ page, createNote }) => {
    const title = uniqueTitle('Назад')
    const id = await createNote(title)

    await page.goto(ROUTE_PATHS.HOME)
    await page.getByRole('link', { name: title }).click()
    await expect(page).toHaveURL(NOTE_ROUTES.ITEM(id))
    await page.getByRole('button', { name: 'Удалить заметку', exact: true }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(ROUTE_PATHS.HOME)
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByRole('link', { name: title })).toBeVisible()
    await page.getByRole('link', { name: title }).click()
    await expect(page).toHaveURL(NOTE_ROUTES.ITEM(id))
  })

  test('should leave the history untouched when undo is pressed while a dialog is open', async ({
    page,
    createNote
  }) => {
    const id = await createNote(uniqueTitle('Диалог'))
    const edited = uniqueTitle('Правка')

    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill(edited)
    await page.getByRole('button', { name: 'Удалить заметку', exact: true }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.keyboard.press('Control+z')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(field).toHaveValue(edited)
  })

  test('should share undo and redo when keyboard focus or layout changes', async ({ page, createNote }) => {
    const title = uniqueTitle('Единая история')
    const id = await createNote(title)

    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill('Изменено')
    await field.press('Control+z')
    await expect(field).toHaveValue(title)
    await field.press('Control+Shift+z')
    await expect(field).toHaveValue('Изменено')
    await page.getByRole('button', { name: 'Добавить пункт' }).focus()
    await page.keyboard.press('Control+z')
    await expect(field).toHaveValue(title)
    await page.keyboard.press('Control+Shift+z')
    await expect(field).toHaveValue('Изменено')

    await field.dispatchEvent('keydown', {
      key: 'я',
      code: 'KeyZ',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    })

    await expect(field).toHaveValue(title)

    const handled = await field.evaluate(
      (element) =>
        !element.dispatchEvent(
          new InputEvent('beforeinput', {
            inputType: 'historyRedo',
            bubbles: true,
            cancelable: true
          })
        )
    )

    expect(handled).toBe(true)
    await expect(field).toHaveValue('Изменено')
  })

  test('should restore pending text and undo when an edited note reloads', async ({ page, createNote }) => {
    const title = uniqueTitle('До правки')

    const id = await createNote(title, [
      { id: 'tea', text: 'Чай', done: false },
      { id: 'coffee', text: 'Кофе', done: true }
    ])

    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill('Черновик до паузы')
    await field.press('Tab')
    await page.getByRole('textbox', { name: 'Пункт 1', exact: true }).fill('До паузы')
    await page.reload()

    const dialog = page.getByRole('dialog', { name: 'Найден несохранённый черновик' })

    await dialog.getByRole('button', { name: 'Восстановить', exact: true }).click()
    await expect(field).toBeFocused()
    await expect(page.getByRole('status').filter({ hasText: 'Черновик восстановлен' })).toHaveCount(1)
    await expect(field).toHaveValue('Черновик до паузы')
    await expect(page.getByRole('textbox', { name: 'Пункт 1', exact: true })).toHaveValue('До паузы')
    await expect(page.getByRole('checkbox', { name: 'Выполнено: Кофе' })).toBeChecked()
    await page.keyboard.press('Control+z')
    await expect(page.getByRole('textbox', { name: 'Пункт 1', exact: true })).toHaveValue('Чай')
    await page.keyboard.press('Control+z')
    await expect(field).toHaveValue(title)
  })

  test('should keep both the earlier draft and the new edits when the offer is postponed', async ({
    page,
    createNote
  }) => {
    const title = uniqueTitle('Черновик один')
    const id = await createNote(title)

    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })
    const offer = page.getByRole('dialog', { name: 'Найден несохранённый черновик' })

    await field.fill('Первая версия черновика')
    await page.reload()
    await offer.press('Escape')
    await expect(page.getByText('новые правки хранятся в этой вкладке')).toBeVisible()
    await field.fill('Новая правка')
    await page.getByRole('link', { name: 'Заметки', exact: true }).click()
    await page.getByRole('dialog', { name: 'Уйти из редактора?' }).getByRole('button', { name: 'Уйти' }).click()
    await expect(page).toHaveURL(ROUTE_PATHS.HOME)
    await page.goto(NOTE_ROUTES.ITEM(id))
    await offer.getByRole('button', { name: 'Восстановить', exact: true }).click()
    await expect(field).toHaveValue('Новая правка')
    await expect(offer).toHaveCount(0)
    await page.getByRole('button', { name: 'Открыть черновик' }).click()
    await offer.getByRole('button', { name: 'Восстановить', exact: true }).click()
    await expect(field).toHaveValue('Первая версия черновика')
  })

  test('should offer the edits of this tab after reload when the server did not receive them', async ({
    page,
    createNote,
    consoleGuard
  }) => {
    const id = await createNote(uniqueTitle('Без сети'))
    const edited = uniqueTitle('Не дошло до сервера')

    consoleGuard.allowHttpError(draftEndpoint(id), HTTP_STATUS.SERVICE_UNAVAILABLE)

    await failDraftWrites(page, id)
    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill(edited)
    await page.reload()

    await page
      .getByRole('dialog', { name: 'Найден несохранённый черновик' })
      .getByRole('button', { name: 'Восстановить', exact: true })
      .click()

    await expect(field).toHaveValue(edited)
  })

  test('should offer the edits of a closed tab in a new tab when the server did not receive them', async ({
    page,
    context,
    createNote,
    consoleGuard
  }) => {
    const id = await createNote(uniqueTitle('Закрытая вкладка'))
    const edited = uniqueTitle('Последняя правка')

    consoleGuard.allowHttpError(draftEndpoint(id), HTTP_STATUS.SERVICE_UNAVAILABLE)

    await failDraftWrites(context, id)
    await page.goto(NOTE_ROUTES.ITEM(id))
    await page.getByLabel('Название', { exact: true }).fill(edited)
    await page.goto('about:blank')
    await page.close()

    const next = await context.newPage()

    await next.goto(NOTE_ROUTES.ITEM(id))

    await next
      .getByRole('dialog', { name: 'Найден несохранённый черновик' })
      .getByRole('button', { name: 'Восстановить', exact: true })
      .click()

    await expect(next.getByLabel('Название', { exact: true })).toHaveValue(edited)
  })

  test('should restore the own new note of a tab when another client replaced the shared draft', async ({
    page,
    browser,
    request
  }) => {
    const own = uniqueTitle('Заметка А')
    const other = uniqueTitle('Заметка Б')

    expect((await request.delete(draftEndpoint(NEW_DRAFT_KEY))).ok()).toBe(true)
    await page.goto(NOTE_ROUTES.NEW)

    const ownWrite = page.waitForResponse(isDraftWrite(NEW_DRAFT_KEY))

    await page.getByLabel('Название', { exact: true }).fill(own)
    await ownWrite
    expect((await request.delete(draftEndpoint(NEW_DRAFT_KEY))).ok()).toBe(true)

    const client = await browser.newContext()
    const second = await client.newPage()

    await second.goto(new URL(NOTE_ROUTES.NEW, page.url()).href)

    const otherWrite = second.waitForResponse(isDraftWrite(NEW_DRAFT_KEY))

    await second.getByLabel('Название', { exact: true }).fill(other)
    await otherWrite
    await page.reload()

    await page
      .getByRole('dialog', { name: 'Найден несохранённый черновик' })
      .getByRole('button', { name: 'Восстановить', exact: true })
      .click()

    await expect(page.getByLabel('Название', { exact: true })).toHaveValue(own)
    await client.close()
  })

  test('should return to the saved version without leaving when editing is cancelled', async ({ page, createNote }) => {
    const title = uniqueTitle('Сохранённая версия')
    const id = await createNote(title)

    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill('Ненужная правка')
    await page.getByRole('button', { name: 'Отменить правки' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Отменить правки' }).click()
    await expect(page).toHaveURL(NOTE_ROUTES.ITEM(id))
    await expect(field).toHaveValue(title)
    await expect(field).toBeFocused()
    await expect(page.getByRole('status').filter({ hasText: 'Правки отменены' })).toHaveCount(1)
    await page.reload()
    await expect(field).toHaveValue(title)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('should block saving and point to the item when an item is empty', async ({ page, createNote }) => {
    const id = await createNote(uniqueTitle('Пустой пункт'))

    await page.goto(NOTE_ROUTES.ITEM(id))
    await page.getByRole('button', { name: 'Добавить пункт' }).click()

    const item = page.getByRole('textbox', { name: 'Пункт 1', exact: true })
    const save = page.getByRole('button', { name: 'Сохранить', exact: true })

    await expect(save).toHaveAttribute('aria-disabled', 'true')
    await expect(item).toHaveAccessibleDescription('Заполните или удалите пустые пункты, чтобы сохранить заметку.')
    await expect(page.getByRole('checkbox', { name: 'Выполнено: пункт 1' })).toBeDisabled()
    await save.focus()
    await page.keyboard.press('Enter')
    await expect(item).toBeFocused()
    await item.fill('Готово')
    await expect(save).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('should keep the caret at the end when typing into a row that is still appearing', async ({
    page,
    createNote
  }) => {
    const id = await createNote(uniqueTitle('Набор'))

    await page.goto(NOTE_ROUTES.ITEM(id))
    await page.getByRole('button', { name: 'Добавить пункт' }).click()
    await page.keyboard.type('Куп')

    const item = page.getByRole('textbox', { name: 'Пункт 1', exact: true })

    await expect(item).toHaveValue('Куп')

    await page
      .getByRole('listitem')
      .filter({ has: item })
      .evaluate(async (row) => {
        await Promise.allSettled(row.getAnimations({ subtree: true }).map((animation) => animation.finished))
        await new Promise((resolve) => requestAnimationFrame(resolve))
      })

    await page.keyboard.type('ить')
    await expect(item).toHaveValue('Купить')
  })

  test('should keep keyboard focus below the toolbar when tabbing backwards through a long checklist', async ({
    page,
    createNote
  }) => {
    const id = await createNote(
      uniqueTitle('Длинный список'),
      Array.from({ length: 30 }, (_, index) => ({ id: 'r' + index, text: 'Пункт ' + index, done: false }))
    )

    await page.setViewportSize({ width: 640, height: 360 })
    await page.goto(NOTE_ROUTES.ITEM(id))
    await page.getByRole('button', { name: 'Добавить пункт' }).focus()

    const toolbar = page.getByRole('group', { name: 'Действия с заметкой' })

    for (let index = 0; index < 40; index++) {
      await page.keyboard.press('Shift+Tab')

      const bounds = await toolbar.evaluate(async (panel) => {
        await new Promise((resolve) => requestAnimationFrame(resolve))

        return {
          panel: panel.getBoundingClientRect().bottom,
          focus: document.activeElement?.getBoundingClientRect().top
        }
      })

      expect(bounds.focus).toBeGreaterThanOrEqual(bounds.panel)
    }
  })
})
