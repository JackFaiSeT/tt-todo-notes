import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fc from 'fast-check'
import { DRAFT_SCHEMA_VERSION, HISTORY_LIMIT, OPERATION_TYPES } from '@shared/contract/notes/constants'
import { parseTodoId } from '@shared/contract/notes/ids'
import { readStoredDraft } from '@shared/contract/notes/stored-draft'
import { BrowserTimer } from '@shared/services/time'
import { toContent } from '@notes/utils/content'
import { NotesAdapter } from '@notes/adapter'
import { EditHistory } from '@notes/history/edit-history'
import { todo, start, operations } from '../../../../factories/history'

const REQUIRED_HISTORY_LIMIT = 50

const session = () => new EditHistory(new BrowserTimer(), { content: start, onChange: vi.fn<() => void>() })

describe('Notes/EditHistory', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('should clear redo when new input follows an undo', () => {
    const h = session()

    h.input(null, 'Заголовок')
    h.step('undo')
    h.input(todo.id, 'После отмены')
    expect(h.canRedo).toBe(false)
    expect(h.step('redo')).toBe(false)
  })

  it.each(operations.filter((operation) => operation.type !== OPERATION_TYPES.TITLE))(
    'should clear redo when $type follows an undo',
    (operation) => {
      const h = session()

      h.input(null, 'Заголовок')
      h.commit()
      h.step('undo')
      expect(h.canRedo).toBe(true)
      h.perform(operation)
      expect(h.canRedo).toBe(false)
      expect(h.step('redo')).toBe(false)
    }
  )

  it('should split entries when the field loses focus before the pause', () => {
    const h = session()

    h.input(null, 'Пе')
    h.commit()
    h.input(null, 'Перв')

    expect(h.serialize().undo).toEqual([
      { type: OPERATION_TYPES.TITLE, before: 'План', after: 'Пе' },
      { type: OPERATION_TYPES.TITLE, before: 'Пе', after: 'Перв' }
    ])
  })

  it('should omit empty differences when committing text', () => {
    const h = session()

    h.input(null, '')
    h.input(null, start.title)
    h.commit()
    expect(h.canUndo).toBe(false)
  })

  it('should group input when typing before the timeout', () => {
    const h = session()

    h.input(null, 'П')
    vi.advanceTimersByTime(500)
    h.input(null, 'Пр')
    expect(h.content.title).toBe('Пр')
    vi.advanceTimersByTime(700)
    h.input(null, 'При')
    h.commit()
    h.input(null, 'Приём')

    expect(h.serialize().undo).toEqual([
      { type: OPERATION_TYPES.TITLE, before: 'План', after: 'Пр' },
      { type: OPERATION_TYPES.TITLE, before: 'Пр', after: 'При' },
      { type: OPERATION_TYPES.TITLE, before: 'При', after: 'Приём' }
    ])
  })

  it('should commit a pending change when switching fields or undoing', () => {
    const h = session()

    h.input(null, 'Заголовок')
    h.input(todo.id, 'Т')
    h.input(todo.id, 'Текст')
    h.step('undo')
    expect(h.content).toEqual({ ...start, title: 'Заголовок' })
    h.step('undo')
    expect(h.content).toEqual(start)
  })

  it('should record pending text before a structural operation when typing has not settled', () => {
    const h = session()

    h.input(null, 'Журнал')

    for (const op of operations.slice(2)) {
      h.perform(op)
    }

    expect(h.serialize().undo).toEqual([
      { type: OPERATION_TYPES.TITLE, before: start.title, after: 'Журнал' },
      ...operations.slice(2)
    ])
  })

  it('should restore both branches when resuming a draft', () => {
    const h = session()

    h.input(null, 'А')
    h.perform(operations[2]!)
    h.step('undo')

    const data = JSON.parse(JSON.stringify(h.serialize()))

    const restored = new EditHistory(new BrowserTimer(), {
      content: h.content,
      onChange: vi.fn<() => void>(),
      history: data
    })

    restored.step('redo')
    expect(restored.content.todos[0]?.done).toBe(true)
    restored.step('undo')
    restored.step('undo')
    expect(restored.content).toEqual(start)
  })

  it.each([
    [REQUIRED_HISTORY_LIMIT + 1, '1'],
    [REQUIRED_HISTORY_LIMIT, start.title]
  ] as const)('should retain the newest history entries when %i changes are committed', (count, oldest) => {
    const h = session()

    for (let i = 1; i <= count; i++) {
      h.input(null, String(i))
      h.commit()
    }

    expect(h.serialize().undo).toHaveLength(REQUIRED_HISTORY_LIMIT)

    for (let i = 0; i < REQUIRED_HISTORY_LIMIT; i++) {
      h.step('undo')
    }

    expect(h.content.title).toBe(oldest)
    expect(h.step('undo')).toBe(false)
  })

  const sequence = (values: number[]) => {
    const h = session()

    values.forEach((value, index) => {
      const item = h.content.todos[0]

      switch (value % 5) {
        case 0:
          h.input(null, 'Заголовок ' + index)
          h.commit()
          break
        case 1:
          if (item) {
            h.input(item.id, 'Текст ' + index)
            h.commit()
          }

          break
        case 2:
          if (item) {
            h.perform({ type: OPERATION_TYPES.TODO_TOGGLE, todoId: item.id, done: !item.done })
          }

          break
        case 3:
          if (item) {
            h.perform({ type: OPERATION_TYPES.TODO_REMOVE, todo: item, index: 0 })
          }

          break
        default:
          h.perform({ type: OPERATION_TYPES.TODO_ADD, todo: { ...todo, id: parseTodoId(String(index)) }, index: 0 })
      }
    })

    return h
  }

  it('should restore the starting content when undoing a generated sequence', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: HISTORY_LIMIT }), (values) => {
        const h = sequence(values)

        while (h.canUndo) {
          h.step('undo')
        }

        expect(h.content).toEqual(start)
      })
    )
  })

  it('should preserve the result when redoing a generated sequence', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { minLength: 60, maxLength: 130 }), fc.nat(), (values, k) => {
        const h = sequence(values)
        const end = toContent(h.content)
        const n = k % (h.serialize().undo.length + 1)

        expect(h.serialize().undo.length).toBeLessThanOrEqual(HISTORY_LIMIT)

        for (let i = 0; i < n; i++) {
          expect(h.step('undo')).toBe(true)
        }

        const { undo, redo } = h.serialize()

        expect(undo.length + redo.length).toBeLessThanOrEqual(HISTORY_LIMIT)

        for (let i = 0; i < n; i++) {
          expect(h.step('redo')).toBe(true)
        }

        expect(h.content).toEqual(end)
      })
    )
  })

  it('should produce a draft the storage accepts when any generated sequence is serialized', () => {
    const adapter = new NotesAdapter()

    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 130 }), fc.nat(), (values, k) => {
        const h = sequence(values)
        const steps = k % (h.serialize().undo.length + 1)

        for (let i = 0; i < steps; i++) {
          h.step('undo')
        }

        const { draft } = adapter.toDraftBody({
          noteId: null,
          baseVersion: null,
          content: h.content,
          history: h.serialize(),
          savedAt: 1
        })

        expect(readStoredDraft(draft)).toMatchObject({ schemaVersion: DRAFT_SCHEMA_VERSION })
      })
    )
  })
})
