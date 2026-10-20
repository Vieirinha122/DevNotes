import { FileText, LogOut, Pin, Plus, Search, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { formatNoteListTimestamp } from "../notes.utils";
import type { CategoryFilter, NoteItem } from "../types";

interface NoteListProps {
  userEmail: string;
  userName?: string | null;
  onLogout: () => void;
  notes: NoteItem[];
  draftNote?: NoteItem | null;
  isLoading?: boolean;
  isCompact?: boolean;
  selectedItemId: string | null;
  onSelectNote: (id: string) => void;
  onSelectDraft: () => void;
  onNewNote: () => void | Promise<void>;
  isCreatingNote?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: CategoryFilter;
  onFilterTypeChange: (filter: CategoryFilter) => void;
  onDeleteNote?: (id: string) => void | Promise<void>;
}

const loadingSkeletonKeys = ["loading-1", "loading-2", "loading-3", "loading-4"];

export function NoteList({
  userEmail,
  userName = null,
  onLogout,
  notes,
  draftNote = null,
  isLoading = false,
  isCompact = false,
  selectedItemId,
  onSelectNote,
  onSelectDraft,
  onNewNote,
  isCreatingNote = false,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  onDeleteNote,
}: NoteListProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const focusSearchInput = () => {
    onFilterTypeChange("all");
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  return (
    <aside
      className={cn(
        "flex min-h-screen shrink-0 flex-col select-none",
        isCompact
          ? "safe-top safe-bottom w-full bg-background"
          : "w-80 border-r border-border/40 bg-card/25 md:w-84",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-border/40 bg-card/40",
          isCompact ? "sticky top-0 z-20 px-4 py-3 backdrop-blur-xl" : "p-3.5",
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-primary/40 bg-primary/20 text-primary">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            DevNote
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className="max-w-[130px] truncate text-[11px] font-mono text-muted-foreground/80"
            title={userName?.trim() || userEmail}
          >
            {userName?.trim() || userEmail.split("@")[0]}
          </span>
          <button
            type="button"
            onClick={onLogout}
            title="Sair da conta"
            className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className={cn("space-y-2.5 border-b border-border/40", isCompact ? "px-4 py-3" : "p-3")}>
        <Button
          type="button"
          variant="primary"
          onClick={onNewNote}
          isLoading={isCreatingNote}
          className={cn(
            "flex h-8.5 w-full items-center justify-center gap-1.5 text-xs font-semibold shadow-sm shadow-primary/20",
            isCompact && "hidden",
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Nova Nota</span>
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar notas ou tags..."
            className={cn(
              "w-full rounded-md border border-border/60 bg-input pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
              isCompact ? "h-10 text-sm" : "h-8",
            )}
          />
        </div>

        <div
          className={cn(
            "pt-0.5",
            isCompact ? "flex gap-2 overflow-x-auto pb-1" : "flex items-center space-x-1",
          )}
        >
          <button
            type="button"
            onClick={() => onFilterTypeChange("all")}
            className={cn(
              "cursor-pointer rounded px-2.5 py-1 text-[11px] font-mono transition-colors",
              isCompact && "shrink-0 px-3 py-1.5 text-xs",
              filterType === "all"
                ? "bg-white/10 font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todas ({notes.length + (draftNote ? 1 : 0)})
          </button>
          <button
            type="button"
            onClick={() => onFilterTypeChange("pinned")}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 text-[11px] font-mono transition-colors",
              isCompact && "shrink-0 px-3 py-1.5 text-xs",
              filterType === "pinned"
                ? "border border-primary/30 bg-primary/15 font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Pin className="h-2.5 w-2.5" />
            Fixadas
          </button>
        </div>
      </div>

      <div className={cn("flex-1 divide-y divide-border/30 overflow-y-auto", isCompact && "pb-28")}>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {loadingSkeletonKeys.map((key) => (
              <div
                key={key}
                className="space-y-2 rounded-md border border-border/30 bg-white/[0.02] p-3"
              >
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 && !draftNote ? (
          <div className="space-y-1 p-6 text-center text-xs text-muted-foreground">
            <p>Nenhuma nota encontrada.</p>
            <p className="text-[11px] opacity-70">Clique em "Nova Nota" para comecar.</p>
          </div>
        ) : (
          <>
            {draftNote && (
              <button
                type="button"
                onClick={onSelectDraft}
                className={cn(
                  "w-full space-y-1.5 border-b border-border/30 text-left transition-colors focus:outline-none",
                  isCompact ? "rounded-2xl px-4 py-4" : "p-3.5",
                  selectedItemId === draftNote.id
                    ? "border-l-2 border-primary bg-primary/12"
                    : "cursor-pointer bg-primary/6 hover:bg-primary/10",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-primary">Rascunho local</p>
                    <h4 className="line-clamp-1 text-xs font-semibold leading-snug text-foreground">
                      {draftNote.title.trim() || "Nova anotacao"}
                    </h4>
                  </div>
                  <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                </div>

                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
                  {draftNote.content ? draftNote.content.slice(0, 100) : "Pronto para escrever"}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground/60">
                  <div className="flex max-w-[150px] items-center gap-1 truncate">
                    {draftNote.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                  <span className="shrink-0">
                    {formatNoteListTimestamp(draftNote.createdAt, draftNote.updatedAt)}
                  </span>
                </div>
              </button>
            )}

            {notes.map((note) => {
              const isSelected = selectedItemId === note.id;

              return (
                <div
                  key={note.id}
                  className={cn(
                    "group relative w-full transition-colors",
                    isSelected
                      ? "border-l-2 border-primary bg-white/[0.08]"
                      : "hover:bg-white/[0.03]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectNote(note.id)}
                    className={cn(
                      "w-full space-y-1.5 cursor-pointer text-left focus:outline-none",
                      isCompact ? "px-4 py-4 pr-10" : "p-3.5 pr-8",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="line-clamp-1 flex-1 text-xs font-semibold leading-snug text-foreground">
                        {note.title || "Sem titulo"}
                      </h4>
                      {note.isPinned && <Pin className="h-3 w-3 shrink-0 rotate-45 text-primary" />}
                    </div>

                    <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
                      {note.content ? note.content.slice(0, 100) : "Nota vazia"}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground/60">
                      <div className="flex max-w-[150px] items-center gap-1 truncate">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                      <span className="shrink-0">
                        {formatNoteListTimestamp(note.createdAt, note.updatedAt)}
                      </span>
                    </div>
                  </button>

                  {onDeleteNote && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteNote(note.id);
                      }}
                      title="Excluir nota"
                      className="absolute right-2.5 top-3 cursor-pointer rounded p-1 text-rose-400/80 transition-colors hover:bg-rose-500/15 hover:text-rose-300 focus:outline-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {isCompact && (
        <>
          <button
            type="button"
            onClick={onNewNote}
            className="safe-bottom fixed bottom-20 right-4 z-30 flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_16px_48px_hsl(var(--primary)/0.35)] transition-transform active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Nova nota</span>
          </button>

          <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-card/95 px-2 py-2 backdrop-blur-xl">
            <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onFilterTypeChange("all");
                }}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-mono transition-colors",
                  filterType === "all" && !searchQuery
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Notas</span>
              </button>

              <button
                type="button"
                onClick={focusSearchInput}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-mono transition-colors",
                  searchQuery
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>

              <button
                type="button"
                onClick={() => onFilterTypeChange("pinned")}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-mono transition-colors",
                  filterType === "pinned"
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Pin className="h-4 w-4" />
                <span>Fixadas</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </aside>
  );
}
