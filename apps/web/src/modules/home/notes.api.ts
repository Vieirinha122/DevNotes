import { apiRequest } from "../../lib/api";
import type { NoteItem, NoteKind } from "./types";

interface NotesListResponse {
  notas: NoteItem[];
  paginacao: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
    temProximo: boolean;
    temAnterior: boolean;
  };
}

export interface CreateNotePayload {
  id: string;
  title: string;
  content: string;
  tags: string[];
  kind?: NoteKind;
  isPinned?: boolean;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
  version?: number;
}

function buildSearchParams(input: { search?: string; pinned?: boolean }) {
  const params = new URLSearchParams();

  if (input.search?.trim()) {
    params.set("search", input.search.trim());
  }

  if (input.pinned !== undefined) {
    params.set("pinned", String(input.pinned));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listNotes(input: { search?: string; pinned?: boolean }) {
  return apiRequest<NotesListResponse>(`/notes${buildSearchParams(input)}`, {
    method: "GET",
    requireAuth: true,
  });
}

export async function createNote(payload: CreateNotePayload) {
  return apiRequest<NoteItem>("/notes", {
    method: "POST",
    body: payload,
    requireAuth: true,
  });
}

export async function updateNote(noteId: string, payload: UpdateNotePayload) {
  return apiRequest<NoteItem>(`/notes/${noteId}`, {
    method: "PATCH",
    body: payload,
    requireAuth: true,
  });
}

export async function deleteNote(noteId: string) {
  return apiRequest<void>(`/notes/${noteId}`, {
    method: "DELETE",
    requireAuth: true,
  });
}
