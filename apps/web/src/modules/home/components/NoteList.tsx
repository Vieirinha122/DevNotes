import * as React from "react";
import { Plus, Search, Pin, LogOut, FileText } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { NoteItem, CategoryFilter } from "../types";
import { Button } from "../../../components/ui/button";

interface NoteListProps {
  userEmail: string;
  onLogout: () => void;
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: CategoryFilter;
  onFilterTypeChange: (filter: CategoryFilter) => void;
}

export function NoteList({
  userEmail,
  onLogout,
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
}: NoteListProps) {
  return (
    <aside className="w-80 md:w-84 border-r border-border/40 bg-card/25 flex flex-col h-screen shrink-0 select-none">
      {/* Cabeçalho do App: Marca + Perfil do Usuário */}
      <div className="p-3.5 border-b border-border/40 flex items-center justify-between bg-card/40">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            DevNote
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className="text-[11px] font-mono text-muted-foreground/80 max-w-[130px] truncate"
            title={userEmail}
          >
            {userEmail.split("@")[0]}
          </span>
          <button
            type="button"
            onClick={onLogout}
            title="Sair da conta"
            className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Ações: Nova Nota e Busca */}
      <div className="p-3 space-y-2.5 border-b border-border/40">
        <Button
          type="button"
          variant="primary"
          onClick={onNewNote}
          className="w-full h-8.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Nota</span>
        </Button>

        {/* Input de busca */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar notas ou tags..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-input border border-border/60 rounded-md placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filtros rápidos: Todas e Fixadas */}
        <div className="flex items-center space-x-1 pt-0.5">
          <button
            type="button"
            onClick={() => onFilterTypeChange("all")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
              filterType === "all"
                ? "bg-white/10 text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todas ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => onFilterTypeChange("pinned")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1",
              filterType === "pinned"
                ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Pin className="h-2.5 w-2.5" />
            Fixadas
          </button>
        </div>
      </div>

      {/* Lista vertical de cards de notas */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
            <p>Nenhuma nota encontrada.</p>
            <p className="text-[11px] opacity-70">Clique em "Nova Nota" para começar.</p>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNoteId === note.id;

            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectNote(note.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelectNote(note.id)}
                className={cn(
                  "p-3.5 space-y-1.5 transition-colors cursor-pointer text-left focus:outline-none",
                  isSelected
                    ? "bg-white/[0.08] border-l-2 border-primary"
                    : "hover:bg-white/[0.03]",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-1 flex-1">
                    {note.title || "Sem título"}
                  </h4>
                  {note.isPinned && (
                    <Pin className="h-3 w-3 text-primary shrink-0 rotate-45" />
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                  {note.content ? note.content.slice(0, 100) : "Nota vazia"}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground/60">
                  <div className="flex items-center gap-1 truncate max-w-[150px]">
                    {note.tags.slice(0, 3).map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                  <span className="shrink-0">{note.updatedAt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
