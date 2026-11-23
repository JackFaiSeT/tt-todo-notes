import { HTTP_STATUS } from '@shared/contract/http'
import { NOTES_PATHS, NOTE_PAGE_DEFAULT } from '@shared/contract/notes/constants'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { uniqueTitle, expect, test } from '@e2e/fixtures'
import { NOTE_ROUTES } from '@notes/constants/routes'
import { startTestServer } from '@setup/nitro'

test.use({
  baseURL: async ({ baseURL: _baseURL }, use) => {
    const output = process.env.NOTES_TEST_OUTPUT

    if (!output) {
      throw new Error('Отсутствует тестовая сборка')
    }

    const server = await startTestServer(output)

    try {
      await use(server.address.href)
    } finally {
      await server.close()
    }
  }
})

test.describe('Notes/Pagination', () => {
  test('should keep appended pages in order when another tab saves and a loaded note is deleted', async ({
    page,
    context,
    consoleGuard,
    createNote
  }) => {
    const prefix = uniqueTitle('Страница')
    const oldest = await createNote(prefix + ' 0')

    for (let i = 1; i <= NOTE_PAGE_DEFAULT; i++) {
      await createNote(prefix + ' ' + i)
    }

    await page.goto(ROUTE_PATHS.HOME)

    const cards = page.getByRole('article')
    const more = page.getByRole('button', { name: 'Показать ещё' })

    await expect(cards).toHaveCount(NOTE_PAGE_DEFAULT)
    await expect(page.getByText('Количество заметок: ' + (NOTE_PAGE_DEFAULT + 1))).toBeAttached()

    let release = (): void => undefined

    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    await page.route(
      (url) => url.pathname === NOTES_PATHS.COLLECTION && url.searchParams.has('cursor'),
      async (route) => {
        consoleGuard.allowHttpError(route.request().url(), HTTP_STATUS.SERVICE_UNAVAILABLE)
        await gate
        await route.fulfill({ status: HTTP_STATUS.SERVICE_UNAVAILABLE, contentType: 'application/json', body: '{}' })
      },
      { times: 1 }
    )

    await more.click()
    await expect(page.getByRole('button', { name: 'Загружаем…' })).toBeDisabled()
    release()
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
    await expect(cards).toHaveCount(NOTE_PAGE_DEFAULT)

    const loaded = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === NOTES_PATHS.COLLECTION &&
        new URL(response.url()).searchParams.has('cursor')
    )

    await more.press('Enter')

    const added = (await (await loaded).json()).items.length

    await expect(page.getByRole('main').getByRole('status')).toHaveText('Добавлено заметок: ' + added)
    await expect(cards.nth(NOTE_PAGE_DEFAULT).getByRole('link')).toBeFocused()
    await expect(cards.nth(NOTE_PAGE_DEFAULT).getByRole('link')).toHaveText(prefix + ' 0')

    const other = await context.newPage()

    await other.goto(NOTE_ROUTES.ITEM(oldest))
    await other.getByLabel('Название', { exact: true }).fill(prefix + ' обновлена')
    await other.getByRole('button', { name: 'Сохранить', exact: true }).click()
    await expect(cards.first().getByRole('link')).toHaveText(prefix + ' обновлена')
    await expect(cards).toHaveCount(NOTE_PAGE_DEFAULT + added)

    const removed = cards.nth(NOTE_PAGE_DEFAULT)
    const title = await removed.getByRole('link').innerText()

    await removed.getByRole('button').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Удалить', exact: true }).click()
    await expect(page.getByRole('link', { name: title, exact: true })).toHaveCount(0)
    await expect(cards.first().getByRole('link')).toHaveText(prefix + ' обновлена')
  })
})
