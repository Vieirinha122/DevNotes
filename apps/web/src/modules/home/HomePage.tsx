import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
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

export function HomePage({ user, onLogout }: HomePageProps) {
  const queryClient = useQueryClient();
  const [initialDraftState] = useState(() => {
    const loadedDraft = loadNewDraft(user.email);

    return {
      draft: loadedDraft,
      recovered: Boolean(loadedDraft),
    };
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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

      return notes[0]?.id ?? null;
    });
  }, [newDraft, notes]);

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
    setSelectedItemId(notes[0]?.id ?? null);
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

  const handleDeleteNote = async (id: string) => {
    await deleteNoteMutation.mutateAsync(id);
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
    <div className="flex h-screen w-full select-none overflow-hidden bg-background antialiased">
      <NoteList
        userEmail={user.email}
        userName={user.name ?? null}
        onLogout={onLogout}
        notes={notes}
        draftNote={newDraft}
        isLoading={notesQuery.isLoading}
        selectedItemId={selectedItemId}
        onSelectNote={setSelectedItemId}
        onSelectDraft={() => setSelectedItemId(NEW_NOTE_DRAFT_ID)}
        onNewNote={handleNewNote}
        isCreatingNote={false}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        onDeleteNote={handleDeleteNote}
      />

      <main className="flex flex-1 overflow-hidden">
        <NoteWorkspace
          note={selectedNote}
          draftNote={selectedDraft}
          userEmail={user.email}
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
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePin}
        />
      </main>
    </div>
  );
}
