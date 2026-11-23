import type { Page } from '@playwright/test'
import { NOTES_PATHS } from '@shared/contract/notes/constants'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { uniqueTitle, expect, test } from '@e2e/fixtures'

test.describe('Notes/List', () => {
  const expectPageToFit = async (page: Page) => {
    const widths = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }))

    expect(widths.document).toBeLessThanOrEqual(widths.viewport)
  }

  test('should fit long checklist text when the viewport is narrow', async ({ page, createNote }) => {
    const title = uniqueTitle('Планирование'.repeat(12))
    const text = 'Согласовать окно выкладки с командой поддержки и предупредить пользователей заранее'

    await createNote(title, [
      { id: 'a', text, done: false },
      { id: 'b', text: 'Задача'.repeat(35), done: false }
    ])

    await page.setViewportSize({ width: 360, height: 900 })
    await page.goto(ROUTE_PATHS.HOME)

    const card = page.getByRole('article').filter({ has: page.getByRole('link', { name: title }) })

    const preview = card.getByRole('listitem').filter({ hasText: text })

    await expect(preview).toBeVisible()
    await expectPageToFit(page)
    await card.getByRole('link').click()
    await expect(page.getByRole('textbox', { name: 'Пункт 1' })).toHaveValue(text)
    await expectPageToFit(page)
  })

  test('should find a note by item text and reset the search when nothing matches', async ({ page, createNote }) => {
    const token = uniqueTitle('Токен')
    const title = uniqueTitle('Искомая')

    await createNote(title, [{ id: 'a', text: 'Купить ' + token, done: false }])
    await createNote(uniqueTitle('Лишняя'))
    await page.goto(ROUTE_PATHS.HOME)

    const search = page.getByRole('searchbox', { name: 'Найти по названию или пункту' })

    await search.fill(token.toUpperCase())
    await expect(page).toHaveURL(/\?q=/u)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByRole('link', { name: title })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Найдено заметок: 1' })).toBeAttached()
    await search.fill(token + ' нет такого')
    await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible()
    await page.getByRole('button', { name: 'Сбросить поиск' }).click()
    await expect(search).toBeFocused()
    await expect(search).toHaveValue('')
    await expect(page).toHaveURL(ROUTE_PATHS.HOME)
  })

  test('should keep the search when the list reloads or the user returns from a note', async ({ page, createNote }) => {
    const token = uniqueTitle('Метка')
    const title = uniqueTitle('Найденная')

    await createNote(title, [{ id: 'a', text: token, done: false }])
    await createNote(uniqueTitle('Посторонняя'))
    await page.goto(ROUTE_PATHS.HOME)

    const search = page.getByRole('searchbox', { name: 'Найти по названию или пункту' })

    await search.fill(token)
    await expect(page).toHaveURL(/\?q=/u)
    await expect(page.getByRole('article')).toHaveCount(1)
    await page.reload()
    await expect(search).toHaveValue(token)
    await expect(page.getByRole('article')).toHaveCount(1)
    await page.getByRole('link', { name: title }).click()
    await expect(page.getByLabel('Название', { exact: true })).toHaveValue(title)
    await page.goBack()
    await expect(search).toHaveValue(token)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByRole('link', { name: title })).toBeVisible()
  })

  test('should expose only the open dialog when the previous one is still closing', async ({ page, createNote }) => {
    const title = uniqueTitle('Повторное удаление')

    await createNote(title)
    await page.goto(ROUTE_PATHS.HOME)

    const remove = page.getByRole('button', { name: 'Удалить заметку «' + title + '»' })

    await remove.click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Оставить' }).click()
    await remove.click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Удалить', exact: true }).click()
    await expect(page.getByRole('link', { name: title })).toHaveCount(0)
  })

  test('should trap and restore focus when deletion is controlled by keyboard', async ({ page, createNote }) => {
    const title = uniqueTitle('Удалить с клавиатуры')

    const neighbor = uniqueTitle('Соседняя заметка')

    await createNote(neighbor)
    await createNote(title)
    await page.goto(ROUTE_PATHS.HOME)

    const remove = page.getByRole('button', { name: 'Удалить заметку «' + title + '»' })

    await expect(remove).toBeVisible()

    const links = await page.getByRole('article').getByRole('link').allTextContents()
    const position = links.indexOf(title)
    const adjacent = links[position + 1] ?? links[position - 1]!

    await remove.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('alertdialog')
    const safe = dialog.getByRole('button', { name: 'Оставить' })

    await expect(safe).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('button', { name: 'Удалить', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(safe).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(remove).toBeFocused()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(remove).toHaveCount(0)
    await expect(page.getByRole('link', { name: adjacent, exact: true })).toBeFocused()
    await expect(page.getByRole('status').filter({ hasText: 'Заметка удалена' })).toHaveCount(1)
  })

  test('should focus the list heading when loading is retried after a failure', async ({ page, createNote }) => {
    const title = uniqueTitle('Повтор')

    await createNote(title)

    await page.route(
      (url) => url.pathname === NOTES_PATHS.COLLECTION,
      (route) => route.fulfill({ json: { broken: true } }),
      { times: 1 }
    )

    await page.goto(ROUTE_PATHS.HOME)
    await page.getByRole('button', { name: 'Повторить' }).click()
    await expect(page.getByRole('link', { name: title })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Заметки', level: 1 })).toBeFocused()
  })

  test('should refresh once when a visible tab receives both resume events', async ({ page, createNote }) => {
    const title = uniqueTitle('Обновление')

    await createNote(title)
    await page.goto(ROUTE_PATHS.HOME)
    await expect(page.getByRole('link', { name: title })).toBeVisible()

    const requests: string[] = []

    page.on('request', (request) => {
      if (new URL(request.url()).pathname === NOTES_PATHS.COLLECTION) {
        requests.push(request.url())
      }
    })

    const completed = page.waitForResponse((response) => new URL(response.url()).pathname === NOTES_PATHS.COLLECTION)

    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await (await completed).finished()
    expect(requests).toHaveLength(1)
  })
})
