export type NoteKind = "NOTE" | "CHECKLIST" | "SNIPPET" | "SOLUTION";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  kind: NoteKind;
  version: number;
  updatedAt: string;
  createdAt: string;
}

export const NEW_NOTE_DRAFT_ID = "draft:new";

export type CategoryFilter = "all" | "pinned";
