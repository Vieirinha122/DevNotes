import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import type { UserSession } from "../auth/AuthPage";
import type { CategoryFilter, NoteItem } from "./types";
import { initialNotes } from "./mockData";
import { NoteList } from "./components/NoteList";
import { NoteWorkspace } from "./components/NoteWorkspace";

const STORAGE_KEY = "devnote_notes_data";

interface HomePageProps {
  user: UserSession;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  // Inicializa notas a partir do localStorage ou mockData
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return initialNotes;
  });

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    return notes[0]?.id || null;
  });

  const [filterType, setFilterType] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Persiste no localStorage sempre que as notas mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignora erro de cota
    }
  }, [notes]);

  // Filtra as notas com base no tipo e busca textual
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (filterType === "pinned" && !note.isPinned) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesTags;
      }

      return true;
    });
  }, [notes, filterType, searchQuery]);

  // Nota atualmente selecionada para o painel de leitura/edição
  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;
  }, [notes, selectedNoteId, filteredNotes]);

  // Criação de nova nota livre
  const handleNewNote = () => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: "Nova Anotação",
      tags: [],
      content: "",
      isPinned: false,
      updatedAt: "Agora",
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  // Atualização de uma nota existente
  const handleUpdateNote = (updated: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  // Exclusão de nota
  const handleDeleteNote = (id: string) => {
    setNotes((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      if (selectedNoteId === id) {
        setSelectedNoteId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  // Alternar fixação (Pin)
  const handleTogglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
    );
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden antialiased select-none">
      {/* Coluna 1: Lista e Ações Rápidas (Esquerda) */}
      <NoteList
        userEmail={user.email}
        onLogout={onLogout}
        notes={filteredNotes}
        selectedNoteId={selectedNote?.id || null}
        onSelectNote={setSelectedNoteId}
        onNewNote={handleNewNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      {/* Coluna 2: Foco Total na Nota (Direita) */}
      <main className="flex-1 flex overflow-hidden">
        <NoteWorkspace
          note={selectedNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePin}
        />
      </main>
    </div>
  );
}
