import type { NoteItem } from "./types";
import { NEW_NOTE_DRAFT_ID } from "./types";

interface StoredNoteDraft {
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  kind: NoteItem["kind"];
  createdAt: string;
  updatedAt: string;
  version: number;
}

function getNewDraftStorageKey(userEmail: string) {
  return `devnote:new-draft:${userEmail}`;
}

function getExistingDraftStorageKey(userEmail: string, noteId: string) {
  return `devnote:edit-draft:${userEmail}:${noteId}`;
}

function parseStoredDraft(rawValue: string | null): StoredNoteDraft | null {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredNoteDraft;
  } catch {
    return null;
  }
}

export function createEmptyDraftNote(): NoteItem {
  const now = new Date().toISOString();

  return {
    id: NEW_NOTE_DRAFT_ID,
    title: "",
    content: "",
    tags: [],
    isPinned: false,
    kind: "NOTE",
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadNewDraft(userEmail: string) {
  const storedDraft = parseStoredDraft(localStorage.getItem(getNewDraftStorageKey(userEmail)));

  if (!storedDraft) {
    return null;
  }

  return {
    id: NEW_NOTE_DRAFT_ID,
    ...storedDraft,
  } satisfies NoteItem;
}

export function saveNewDraft(userEmail: string, draft: NoteItem) {
  const payload: StoredNoteDraft = {
    title: draft.title,
    content: draft.content,
    tags: draft.tags,
    isPinned: draft.isPinned,
    kind: draft.kind,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    version: draft.version,
  };

  localStorage.setItem(getNewDraftStorageKey(userEmail), JSON.stringify(payload));
}

export function clearNewDraft(userEmail: string) {
  localStorage.removeItem(getNewDraftStorageKey(userEmail));
}

export function loadExistingDraft(userEmail: string, noteId: string) {
  return parseStoredDraft(localStorage.getItem(getExistingDraftStorageKey(userEmail, noteId)));
}

export function saveExistingDraft(userEmail: string, noteId: string, draft: StoredNoteDraft) {
  localStorage.setItem(getExistingDraftStorageKey(userEmail, noteId), JSON.stringify(draft));
}

export function clearExistingDraft(userEmail: string, noteId: string) {
  localStorage.removeItem(getExistingDraftStorageKey(userEmail, noteId));
}
