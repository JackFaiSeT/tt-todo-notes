export type Props = {
  isDeleted: boolean
  isInvalid: boolean
  hasConflict: boolean
  hasCandidate: boolean
  draftSavedText: string
}

export type Emits = {
  saveCopy: []
  offerDraft: []
  dropDraft: []
}
