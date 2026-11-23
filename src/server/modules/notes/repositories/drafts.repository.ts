import { eq } from 'drizzle-orm'
import { drafts } from '#server/database/schema'
import type { DatabaseClient } from '#server/database/transactions'
import { draftKeyOf } from '@shared/contract/notes/ids'
import type { DraftKey } from '@shared/contract/notes/ids'
import { readStoredDraft } from '@shared/contract/notes/stored-draft'
import type { Draft } from '@shared/contract/notes/types'
import { NOTES_ERROR_MESSAGES } from '../constants'
import type { IDraftsRepository } from '../types'
import { draftUnreadable } from '../errors'
import { migratePayload } from '../utils/migrate-payload'

export class DraftsRepository implements IDraftsRepository<DatabaseClient> {
  findDraft(key: DraftKey, client: DatabaseClient): Draft | null {
    const payload = client.select({ payload: drafts.payload }).from(drafts).where(eq(drafts.key, key)).get()?.payload

    if (payload === undefined) {
      return null
    }

    try {
      const draft = readStoredDraft(migratePayload(JSON.parse(payload)))

      if (draftKeyOf(draft.noteId) !== key) {
        throw new TypeError(NOTES_ERROR_MESSAGES.DRAFT_KEY_MISMATCH)
      }

      return draft
    } catch (cause) {
      throw draftUnreadable(cause)
    }
  }

  save(key: DraftKey, draft: Draft, client: DatabaseClient): void {
    const record = { key, baseVersion: draft.baseVersion, payload: JSON.stringify(draft), savedAt: draft.savedAt }

    client.insert(drafts).values(record).onConflictDoUpdate({ target: drafts.key, set: record }).run()
  }

  remove(key: DraftKey, client: DatabaseClient): void {
    client.delete(drafts).where(eq(drafts.key, key)).run()
  }
}
