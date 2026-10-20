export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned?: boolean;
  updatedAt: string;
  createdAt: string;
}

export type CategoryFilter = "all" | "pinned";
