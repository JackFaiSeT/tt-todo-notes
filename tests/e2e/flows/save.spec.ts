import { ROUTE_PATHS } from '@shared/constants/routes'
import { uniqueTitle, expect, test } from '@e2e/fixtures'

test.describe('Notes/Save', () => {
  test('should show the saved checklist when a new note is submitted', async ({ page }) => {
    await page.goto(ROUTE_PATHS.HOME)
    await page.getByRole('link', { name: 'Новая заметка' }).click()
    await expect(page.getByLabel('Название', { exact: true })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeDisabled()

    const title = uniqueTitle('Список книг')

    await page.getByLabel('Название', { exact: true }).fill('  ' + title + ' ')
    await page.getByRole('button', { name: 'Добавить пункт' }).click()

    const first = page.getByRole('textbox', { name: 'Пункт 1' })

    await expect(first).toBeFocused()
    await first.fill('  Выбрать книгу ')
    await expect(page.getByRole('checkbox', { name: 'Выполнено: Выбрать книгу', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Удалить пункт «Выбрать книгу»' })).toBeVisible()
    await first.press('Enter')
    await expect(page.getByRole('textbox', { name: 'Пункт 2' })).toBeFocused()
    await expect(page.getByRole('checkbox', { name: 'Выполнено: пункт 2' })).toBeVisible()
    await page.keyboard.press('Backspace')
    await expect(first).toBeFocused()
    await page.getByRole('checkbox').check()

    const reads: string[] = []

    page.on('request', (request) => {
      if (request.method() === 'GET' && /\/api\/(?:drafts|notes)\//u.test(request.url())) {
        reads.push(request.url())
      }
    })

    let release = (): void => undefined

    const pending = new Promise<void>((resolve) => {
      release = resolve
    })

    await page.route(
      '**/api/notes',
      async (route) => {
        await pending
        await route.continue()
      },
      { times: 1 }
    )

    const save = page.getByRole('button', { name: 'Сохранить', exact: true })

    await save.press('Enter')
    await expect(save).toHaveAttribute('aria-busy', 'true')
    await expect(save).toBeFocused()
    release()
    await expect(page).toHaveURL(/\/notes\/(?!new)[a-z0-9]+$/)
    await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeFocused()
    await expect(first).toHaveValue('Выбрать книгу')
    await expect(page.getByRole('button', { name: /Отменить действие/ })).toBeDisabled()
    await page.getByRole('link', { name: 'Заметки', exact: true }).click()

    const card = page.getByRole('article').filter({ hasText: title })

    expect(reads).toEqual([])
    await expect(card).toContainText('1 из 1')
    await expect(card.getByRole('checkbox')).toHaveCount(0)
  })
})
