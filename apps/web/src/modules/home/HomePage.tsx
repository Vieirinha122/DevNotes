import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { ApiError } from "../../lib/api";
import type { UserSession } from "../auth/AuthPage";
import { NoteList } from "./components/NoteList";
import { NoteWorkspace } from "./components/NoteWorkspace";
import { clearNewDraft, createEmptyDraftNote, loadNewDraft, saveNewDraft } from "./draft-storage";
import { createNote, deleteNote, listNotes, updateNote } from "./notes.api";
import type { CategoryFilter, NoteItem } from "./types";
import { NEW_NOTE_DRAFT_ID } from "./types";

interface HomePageProps {
  user: UserSession;
  onLogout: () => void;
}

const notesQueryKey = (search: string, filterType: CategoryFilter) =>
  ["notes", { search, filterType }] as const;

function useIsCompactLayout() {
  const [isCompactLayout, setIsCompactLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches);
    };

    setIsCompactLayout(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isCompactLayout;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const queryClient = useQueryClient();
  const isCompactLayout = useIsCompactLayout();
  const [initialDraftState] = useState(() => {
    const loadedDraft = loadNewDraft(user.email);

    return {
      draft: loadedDraft,
      recovered: Boolean(loadedDraft),
    };
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notaParaExcluir, setNotaParaExcluir] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<NoteItem | null>(initialDraftState.draft);
  const [isDraftRecovered, setIsDraftRecovered] = useState(initialDraftState.recovered);
  const [filterType, setFilterType] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const notesQuery = useQuery({
    queryKey: notesQueryKey(deferredSearchQuery, filterType),
    queryFn: async () => {
      const response = await listNotes({
        search: deferredSearchQuery,
        pinned: filterType === "pinned" ? true : undefined,
      });

      return response.notas;
    },
  });

  const notes = notesQuery.data ?? [];

  useEffect(() => {
    if (notesQuery.error instanceof ApiError && notesQuery.error.status === 401) {
      onLogout();
    }
  }, [notesQuery.error, onLogout]);

  useEffect(() => {
    if (newDraft && !selectedItemId) {
      setSelectedItemId(NEW_NOTE_DRAFT_ID);
    }
  }, [newDraft, selectedItemId]);

  useEffect(() => {
    if (notes.length === 0 && !newDraft) {
      setSelectedItemId(null);
      return;
    }

    setSelectedItemId((current) => {
      if (current === NEW_NOTE_DRAFT_ID && newDraft) {
        return current;
      }

      if (current && notes.some((note) => note.id === current)) {
        return current;
      }

      if (newDraft) {
        return NEW_NOTE_DRAFT_ID;
      }

      if (isCompactLayout) {
        return null;
      }

      return notes[0]?.id ?? null;
    });
  }, [isCompactLayout, newDraft, notes]);

  const createNoteMutation = useMutation({
    mutationFn: createNote,
    onSuccess: async (createdNote) => {
      clearNewDraft(user.email);
      setIsDraftRecovered(false);
      setNewDraft(null);
      setSelectedItemId(createdNote.id);
      queryClient.setQueriesData<NoteItem[]>({ queryKey: ["notes"] }, (currentNotes) => {
        const normalizedNotes = currentNotes ?? [];

        return [createdNote, ...normalizedNotes.filter((note) => note.id !== createdNote.id)];
      });
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateNote>[1] }) =>
      updateNote(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: async (_, deletedId) => {
      setSelectedItemId((current) => (current === deletedId ? null : current));
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const selectedNote = useMemo(() => {
    if (selectedItemId === NEW_NOTE_DRAFT_ID) {
      return null;
    }

    return notes.find((note) => note.id === selectedItemId) ?? null;
  }, [notes, selectedItemId]);

  const selectedDraft = selectedItemId === NEW_NOTE_DRAFT_ID ? newDraft : null;
  const shouldShowWorkspaceOnCompact = isCompactLayout && Boolean(selectedDraft ?? selectedNote);

  const handleNewNote = () => {
    setFilterType("all");
    setSearchQuery("");

    if (newDraft) {
      setSelectedItemId(NEW_NOTE_DRAFT_ID);
      return;
    }

    const draft = createEmptyDraftNote();
    setIsDraftRecovered(false);
    setNewDraft(draft);
    saveNewDraft(user.email, draft);
    setSelectedItemId(NEW_NOTE_DRAFT_ID);
  };

  const handleDraftChange = (draft: NoteItem) => {
    setNewDraft((currentDraft) => {
      if (
        currentDraft &&
        currentDraft.title === draft.title &&
        currentDraft.content === draft.content &&
        currentDraft.isPinned === draft.isPinned &&
        currentDraft.kind === draft.kind &&
        currentDraft.version === draft.version &&
        currentDraft.tags.join(",") === draft.tags.join(",")
      ) {
        return currentDraft;
      }

      saveNewDraft(user.email, draft);
      return draft;
    });
  };

  const handleDiscardDraft = () => {
    clearNewDraft(user.email);
    setIsDraftRecovered(false);
    setNewDraft(null);
    setSelectedItemId(isCompactLayout ? null : (notes[0]?.id ?? null));
  };

  const handleCreateNote = async (
    draft: Pick<NoteItem, "title" | "content" | "tags" | "isPinned" | "kind">,
  ) => {
    await createNoteMutation.mutateAsync({
      id: crypto.randomUUID(),
      title: draft.title,
      content: draft.content,
      tags: draft.tags,
      kind: draft.kind,
      isPinned: draft.isPinned,
    });
  };

  const handleUpdateNote = async (updated: NoteItem) => {
    await updateNoteMutation.mutateAsync({
      id: updated.id,
      payload: {
        title: updated.title,
        content: updated.content,
        tags: updated.tags,
        isPinned: updated.isPinned,
        version: updated.version,
      },
    });
  };

  const handleRequestDeleteNote = (id: string) => {
    setNotaParaExcluir(id);
  };

  const handleConfirmDelete = async () => {
    if (!notaParaExcluir) return;
    await deleteNoteMutation.mutateAsync(notaParaExcluir);
    setNotaParaExcluir(null);
  };

  const handleTogglePin = async (note: NoteItem) => {
    await updateNoteMutation.mutateAsync({
      id: note.id,
      payload: {
        isPinned: !note.isPinned,
        version: note.version,
      },
    });
  };

  const mutationError =
    createNoteMutation.error ?? updateNoteMutation.error ?? deleteNoteMutation.error;

  return (
    <div className="flex h-dvh min-h-dvh w-full select-none overflow-hidden bg-background antialiased">
      {(!isCompactLayout || !shouldShowWorkspaceOnCompact) && (
        <NoteList
          userEmail={user.email}
          userName={user.name ?? null}
          onLogout={onLogout}
          notes={notes}
          draftNote={newDraft}
          isLoading={notesQuery.isLoading}
          isCompact={isCompactLayout}
          selectedItemId={selectedItemId}
          onSelectNote={setSelectedItemId}
          onSelectDraft={() => setSelectedItemId(NEW_NOTE_DRAFT_ID)}
          onNewNote={handleNewNote}
          isCreatingNote={false}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          onDeleteNote={handleRequestDeleteNote}
        />
      )}

      {(!isCompactLayout || shouldShowWorkspaceOnCompact) && (
        <main className="flex min-w-0 flex-1 overflow-hidden">
          <NoteWorkspace
            note={selectedNote}
            draftNote={selectedDraft}
            userEmail={user.email}
            isCompact={isCompactLayout}
            onBack={isCompactLayout ? () => setSelectedItemId(null) : undefined}
            isLoading={notesQuery.isLoading}
            errorMessage={notesQuery.error instanceof Error ? notesQuery.error.message : null}
            mutationErrorMessage={mutationError instanceof Error ? mutationError.message : null}
            onRetry={() => {
              void notesQuery.refetch();
            }}
            isSaving={createNoteMutation.isPending || updateNoteMutation.isPending}
            isDeleting={deleteNoteMutation.isPending}
            onCreateNote={handleCreateNote}
            onDraftChange={handleDraftChange}
            onDiscardDraft={handleDiscardDraft}
            isDraftRecovered={isDraftRecovered}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleRequestDeleteNote}
            onTogglePin={handleTogglePin}
          />
        </main>
      )}

      {/* Confirmação de exclusão de nota (ação destrutiva) */}
      <ConfirmDialog
        open={!!notaParaExcluir}
        title="Excluir nota?"
        description="Esta ação não pode ser desfeita. A nota será removida permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isLoading={deleteNoteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNotaParaExcluir(null)}
      />
    </div>
  );
}
