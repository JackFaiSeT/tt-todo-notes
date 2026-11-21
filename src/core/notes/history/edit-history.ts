import { TITLE_LIMIT, TODO_LIMIT, OPERATION_TYPES } from '@shared/contract/notes/constants'
import type { TodoId } from '@shared/contract/notes/ids'
import type { CancelTimer, ITimer } from '@shared/services/time'
import { HISTORY_DELAY_MS, HISTORY_DIRECTIONS } from '@notes/constants'
import { toContent } from '@notes/utils/content'
import { applyOperation } from '@notes/utils/operation'
import type { NNotes } from '@notes/domain'
import { appendOperation, snapshotHistory } from './stacks'

export interface IEditHistory {
  readonly content: NNotes.Content
  readonly canUndo: boolean
  readonly canRedo: boolean
  serialize(): NNotes.HistoryData
  commit(): void
  input(todoId: TodoId | null, value: string): void
  perform(operation: NNotes.Operation): void
  step(direction: NNotes.HistoryDirection): boolean
}

export type EditHistoryOptions = {
  content: NNotes.Content
  onChange: () => void
  history?: NNotes.HistoryData | undefined
}

export class EditHistory implements IEditHistory {
  content: NNotes.Content

  private stacks: NNotes.HistoryData

  private pending: NNotes.TextOperation | undefined

  private cancelTimer: CancelTimer | undefined

  private readonly onChange: () => void

  constructor(
    private readonly timer: ITimer,
    options: EditHistoryOptions
  ) {
    const { content, history, onChange } = options

    this.onChange = onChange
    this.content = toContent(content)
    this.stacks = history ? snapshotHistory(history) : { undo: [], redo: [] }
  }

  get canUndo(): boolean {
    return Boolean(this.pending) || this.stacks.undo.length > 0
  }

  get canRedo(): boolean {
    return !this.pending && this.stacks.redo.length > 0
  }

  serialize(): NNotes.HistoryData {
    return snapshotHistory(this.stacks, this.pending)
  }

  commit(): void {
    this.cancelTimer?.()
    this.cancelTimer = undefined

    if (!this.pending) {
      return
    }

    this.stacks = this.serialize()
    this.pending = undefined
  }

  input(todoId: TodoId | null, value: string): void {
    const current = todoId === null ? this.content.title : this.content.todos.find((todo) => todo.id === todoId)?.text

    if (current === undefined) {
      return
    }

    const after = value.slice(0, todoId === null ? TITLE_LIMIT : TODO_LIMIT)
    const pendingTodoId = this.pending?.type === OPERATION_TYPES.TODO_TEXT ? this.pending.todoId : null

    if (pendingTodoId !== todoId) {
      this.commit()
    }

    if (after === current) {
      return
    }

    const before = this.pending?.before ?? current

    const operation: NNotes.TextOperation =
      todoId === null
        ? { type: OPERATION_TYPES.TITLE, before, after }
        : { type: OPERATION_TYPES.TODO_TEXT, todoId, before, after }

    this.content = applyOperation(this.content, { operation })
    this.pending = before === after ? undefined : operation
    this.cancelTimer?.()
    this.cancelTimer = this.pending ? this.timer.after(HISTORY_DELAY_MS, () => this.commit()) : undefined
    this.onChange()
  }

  perform(operation: NNotes.Operation): void {
    this.commit()
    this.content = applyOperation(this.content, { operation })
    this.stacks = { undo: appendOperation(this.stacks.undo, operation), redo: [] }
    this.onChange()
  }

  step(direction: NNotes.HistoryDirection): boolean {
    this.commit()

    const operation = this.stacks[direction].pop()

    if (!operation) {
      return false
    }

    const isReversed = direction === HISTORY_DIRECTIONS.UNDO
    const target = isReversed ? HISTORY_DIRECTIONS.REDO : HISTORY_DIRECTIONS.UNDO

    this.content = applyOperation(this.content, { operation, isReversed })
    this.stacks[target] = appendOperation(this.stacks[target], operation)
    this.onChange()

    return true
  }
}
