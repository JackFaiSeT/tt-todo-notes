import { HTTP_STATUS } from '@shared/contract/http'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { uniqueTitle, expect, test, noteEndpoint } from '@e2e/fixtures'
import { NOTE_ROUTES } from '@notes/constants/routes'

test.describe('Notes/Conflicts', () => {
  test('should publish a new copy when another tab deletes the original', async ({
    page,
    context,
    createNote,
    consoleGuard
  }) => {
    const title = uniqueTitle('Общая заметка')
    const id = await createNote(title)
    const copyTitle = uniqueTitle('Локальная копия')

    consoleGuard.allowHttpError(noteEndpoint(id), HTTP_STATUS.NOT_FOUND)
    await page.goto(NOTE_ROUTES.ITEM(id))
    await page.getByLabel('Название', { exact: true }).fill(copyTitle)

    const second = await context.newPage()

    await second.goto(ROUTE_PATHS.HOME)
    await second.getByRole('button', { name: 'Удалить заметку «' + title + '»' }).click()
    await second.getByRole('alertdialog').getByRole('button', { name: 'Удалить', exact: true }).click()

    await page
      .getByRole('dialog', { name: 'Заметка удалена' })
      .getByRole('button', { name: 'Сохранить как новую' })
      .click()

    await expect(page).not.toHaveURL(new RegExp(id + '$'))
    await expect(second.getByRole('link', { name: copyTitle })).toBeVisible()
  })

  test('should overwrite the latest version when a conflict is confirmed', async ({
    page,
    request,
    createNote,
    consoleGuard
  }) => {
    const title = uniqueTitle('Начало')
    const id = await createNote(title)

    consoleGuard.allowHttpError(noteEndpoint(id), HTTP_STATUS.CONFLICT)
    await page.goto(NOTE_ROUTES.ITEM(id))

    const field = page.getByLabel('Название', { exact: true })

    await field.fill('Локальная версия')

    await request.put(noteEndpoint(id), {
      data: { title: 'Другая версия', todos: [], baseVersion: 1 }
    })

    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()

    const dialog = page.getByRole('alertdialog', { name: 'Перезаписать заметку?' })

    await dialog.getByRole('button', { name: 'Перезаписать' }).click()
    await expect(page.getByRole('status').filter({ hasText: /^Сохранено в/ })).toBeVisible()
    expect((await (await request.get(noteEndpoint(id))).json()).title).toBe('Локальная версия')
  })
})
