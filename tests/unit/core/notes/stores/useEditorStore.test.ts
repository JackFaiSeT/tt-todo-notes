import { describe, expect, it } from 'vitest'
import { NEW_DRAFT_KEY } from '@shared/contract/notes/constants'
import { parseNoteId } from '@shared/contract/notes/ids'
import { EDITOR_STATUSES } from '@notes/constants'
import type { NNotes } from '@notes/domain'
import { createEditorTestSession } from '../../../../factories/editor-session'

const noteId = parseNoteId('note-1')

const toDraft = (title: string): NNotes.Draft => ({
  noteId: null,
  baseVersion: null,
  content: { title, todos: [] },
  history: { undo: [], redo: [] },
  savedAt: 1
})

const toNote = (version: number): NNotes.Model => ({
  id: noteId,
  title: 'Сохранённая',
  todos: [],
  version,
  createdAt: 1,
  updatedAt: version
})

const openExisting = () => {
  const session = createEditorTestSession()

  session.editor.openSession(noteId)
  session.editor.applyLoaded(toNote(1), null)

  return session
}

describe('Notes/EditorStore', () => {
  it('should clear the recovery offer when a refreshed draft is absent', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.observeDraft(toDraft('Из другой вкладки'))
    expect(editor.hasCandidate).toBe(true)
    editor.observeDraft(null)
    expect(editor.hasCandidate).toBe(false)
  })

  it('should keep the draft offer when the working copy is edited', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, toDraft('Черновик'))
    editor.inputTitle('Локальная правка')
    editor.commitInput()
    expect(editor.hasCandidate).toBe(true)
    expect(editor.isDirty).toBe(true)
  })

  it('should not offer another draft when the user is editing', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('Печатаю')
    editor.observeDraft(toDraft('Черновик соседней вкладки'))
    expect(editor.hasCandidate).toBe(false)
  })

  it.each([
    ['only whitespace', { title: '   ', todos: [] }],
    ['a blank item next to a filled one', { title: 'Список', todos: ['Пункт', '  '] }],
    ['a single blank item', { title: '', todos: [''] }]
  ])('should forbid saving when the content has %s', (_case, { title, todos }) => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle(title)

    for (const text of todos) {
      const id = editor.addTodo()!

      editor.inputTodo(id, text)
    }

    expect(editor.isValid).toBe(false)
  })

  it('should allow saving when every item has text', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTodo(editor.addTodo()!, 'Пункт')
    expect(editor.isValid).toBe(true)
  })

  it('should refuse a new item when the note already has two hundred items', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)

    for (let index = 0; index < 199; index++) {
      editor.addTodo()
    }

    expect(editor.addTodo()).toBeDefined()
    expect(editor.addTodo()).toBeUndefined()
    expect(editor.content.todos).toHaveLength(200)
  })

  it('should cut entered text when it exceeds the field limit', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('я'.repeat(201))
    editor.inputTodo(editor.addTodo()!, 'т'.repeat(501))

    expect(editor.content.title).toHaveLength(200)
    expect(editor.content.todos[0]?.text).toHaveLength(500)
  })

  it('should replace control characters with spaces when pasted text contains them', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)
    editor.inputTitle('Колонка\tзначение\r\n')
    editor.inputTodo(editor.addTodo()!, 'Сигнал\u0007готов')

    expect(editor.content.title).toBe('Колонка значение  ')
    expect(editor.content.todos[0]?.text).toBe('Сигнал готов')
  })

  it('should only allow unchecking an item when its text is empty', () => {
    const { editor } = createEditorTestSession()

    editor.openSession(NEW_DRAFT_KEY)
    editor.applyLoaded(null, null)

    const id = editor.addTodo()!

    editor.toggleTodo(id)
    expect(editor.content.todos[0]?.done).toBe(false)
    editor.inputTodo(id, 'Текст')
    editor.toggleTodo(id)
    expect(editor.content.todos[0]?.done).toBe(true)
    editor.inputTodo(id, '')
    editor.toggleTodo(id)
    expect(editor.content.todos[0]?.done).toBe(false)
  })

  it('should return to the saved content with an empty history when the session is reverted', () => {
    const { editor } = openExisting()

    editor.inputTitle('Правка')
    editor.addTodo()
    editor.revertSession()
    expect(editor.content).toEqual({ title: 'Сохранённая', todos: [] })
    expect(editor.isDirty).toBe(false)
    expect(editor.canUndo).toBe(false)
    expect(editor.status).toBe(EDITOR_STATUSES.READY)
  })

  it.each([
    ['an equal version', toNote(1)],
    ['an older version', toNote(0)],
    ['another note', { ...toNote(5), id: parseNoteId('note-2') }]
  ])('should ignore a remote note when it is %s', (_case, note) => {
    const { editor } = openExisting()

    editor.inputTitle('Правка')
    editor.observeNote(note)
    expect(editor.hasConflict).toBe(false)
  })

  it('should report a conflict when a newer version arrives during editing', () => {
    const { editor } = openExisting()

    editor.inputTitle('Правка')
    editor.observeNote(toNote(2))
    expect(editor.hasConflict).toBe(true)
  })

  it('should show the newer version without a conflict when it arrives while nothing is edited', () => {
    const { editor } = openExisting()

    editor.observeNote({ ...toNote(2), title: 'Из другой вкладки' })
    expect(editor.content.title).toBe('Из другой вкладки')
    expect(editor.baseVersion).toBe(2)
    expect(editor.isDirty).toBe(false)
    expect(editor.hasConflict).toBe(false)
  })

  it('should ignore remote changes when a save is in progress', () => {
    const { editor } = openExisting()

    editor.inputTitle('Правка')
    editor.startMutation()
    editor.observeNote(null)
    editor.observeNote(toNote(3))
    expect(editor.isDeleted).toBe(false)
    expect(editor.hasConflict).toBe(false)
  })
})
