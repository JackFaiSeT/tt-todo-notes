import { randomUUID } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { HTTP_STATUS } from '@shared/contract/http'
import { parseNoteId } from '@shared/contract/notes/ids'
import { ROUTE_PATHS } from '@shared/constants/routes'
import { noteEndpoint, uniqueTitle, expect, test } from '@e2e/fixtures'
import { NOTE_ROUTES } from '@notes/constants/routes'

const expectAccessible = async (page: Page) => {
  const { violations, incomplete } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(
    incomplete.filter((item) => item.impact === 'serious' || item.impact === 'critical').map((item) => item.id)
  ).toEqual([])

  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([])
}

test.describe('Accessibility/Screens', () => {
  for (const theme of ['dark', 'light'] as const) {
    test.describe(theme, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce', viewport: { width: 320, height: 720 } })

      test('should expose an accessible recovery link when the note is missing', async ({ page, consoleGuard }) => {
        const id = parseNoteId(randomUUID())

        consoleGuard.allowHttpError(noteEndpoint(id), HTTP_STATUS.NOT_FOUND)
        await page.goto(NOTE_ROUTES.ITEM(id))
        await expect(page.getByRole('heading', { name: 'Заметка не найдена' })).toBeVisible()
        await expectAccessible(page)
      })

      for (const path of ['/notes/!', '/unknown/address']) {
        test(`should expose an accessible error page when ${path} is opened directly`, async ({ page }) => {
          await page.goto(path)

          const heading = page.getByRole('heading', { name: 'Страница не найдена' })

          await expect(heading).toBeVisible()
          await expect(heading).not.toBeFocused()
          await expect(page).toHaveTitle(/^Страница не найдена · /u)
          await expectAccessible(page)
          await page.getByRole('link', { name: 'К списку заметок', exact: true }).click()
          await expect(page).toHaveURL(ROUTE_PATHS.HOME)
          await expect(page.getByRole('heading', { name: 'Заметки', level: 1 })).toBeVisible()
        })
      }

      test('should expose an accessible list when a saved note is visible', async ({ page, createNote }) => {
        const title = uniqueTitle('План')

        await createNote(title)
        await page.goto(ROUTE_PATHS.HOME)
        await expect(page.getByRole('link', { name: title })).toBeVisible()
        await expectAccessible(page)
      })

      test('should expose an accessible editor when editing a checklist', async ({ page, createNote }) => {
        const title = uniqueTitle('План')
        const id = await createNote(title, [{ id: 'first', text: 'Покупки', done: true }])

        await page.goto(NOTE_ROUTES.ITEM(id))
        await expect(page.getByRole('checkbox')).toBeChecked()
        await expectAccessible(page)
      })

      test('should expose an accessible dialog when deletion needs confirmation', async ({ page, createNote }) => {
        const title = uniqueTitle('План')

        await createNote(title)
        await page.goto(ROUTE_PATHS.HOME)
        await page.getByRole('button', { name: 'Удалить заметку «' + title + '»' }).click()
        await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Оставить' })).toBeFocused()
        await expectAccessible(page)
      })

      test('should expose an accessible result when a search finds nothing', async ({ page, createNote }) => {
        await createNote(uniqueTitle('План'))
        await page.goto(ROUTE_PATHS.HOME)
        await page.getByRole('searchbox', { name: 'Найти по названию или пункту' }).fill(randomUUID())
        await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible()
        await expectAccessible(page)
      })

      test('should expose an accessible notification when a note is deleted', async ({ page, createNote }) => {
        const title = uniqueTitle('План')

        await createNote(title)
        await page.goto(ROUTE_PATHS.HOME)
        await page.getByRole('button', { name: 'Удалить заметку «' + title + '»' }).click()
        await page.getByRole('alertdialog').getByRole('button', { name: 'Удалить' }).click()
        await expect(page.getByRole('button', { name: 'Закрыть сообщение «Заметка удалена»' })).toBeVisible()
        await expectAccessible(page)
      })

      test('should expose an accessible editor when an item is left empty', async ({ page, createNote }) => {
        const id = await createNote(uniqueTitle('План'))

        await page.goto(NOTE_ROUTES.ITEM(id))
        await page.getByRole('button', { name: 'Добавить пункт' }).click()
        await page.getByLabel('Название', { exact: true }).focus()

        await expect(page.getByRole('textbox', { name: 'Пункт 1', exact: true })).toHaveAttribute(
          'aria-invalid',
          'true'
        )

        await expectAccessible(page)
      })

      test('should expose accessible draft and leave dialogs when edits are pending', async ({ page, createNote }) => {
        const id = await createNote(uniqueTitle('План'))

        await page.goto(NOTE_ROUTES.ITEM(id))
        await page.getByLabel('Название', { exact: true }).fill(uniqueTitle('Правка'))
        await page.reload()
        await expect(page.getByRole('dialog', { name: 'Найден несохранённый черновик' })).toBeVisible()
        await expectAccessible(page)
        await page.getByRole('dialog').getByRole('button', { name: 'Восстановить', exact: true }).click()
        await page.getByRole('link', { name: 'Заметки', exact: true }).click()
        await expect(page.getByRole('dialog', { name: 'Уйти из редактора?' })).toBeVisible()
        await expectAccessible(page)
      })
    })
  }

  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('should expose accessible list and editor when the toolbar shows text labels', async ({
      page,
      createNote
    }) => {
      const title = uniqueTitle('План')
      const id = await createNote(title, [{ id: 'first', text: 'Покупки', done: false }])

      await page.goto(ROUTE_PATHS.HOME)
      await expect(page.getByRole('link', { name: title })).toBeVisible()
      await expectAccessible(page)
      await page.goto(NOTE_ROUTES.ITEM(id))
      await expect(page.getByRole('textbox', { name: 'Пункт 1', exact: true })).toHaveValue('Покупки')
      await expectAccessible(page)
    })
  })
})
