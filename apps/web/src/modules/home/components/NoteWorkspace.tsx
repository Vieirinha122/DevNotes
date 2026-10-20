import MarkdownPreview from "@uiw/react-markdown-preview";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Edit3,
  FileText,
  Pin,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import { cn } from "../../../lib/utils";
import { clearExistingDraft, loadExistingDraft, saveExistingDraft } from "../draft-storage";
import {
  formatMarkdownForPreview,
  formatNoteWorkspaceTimestamp,
  toggleMarkdownCheckbox,
} from "../notes.utils";
import type { NoteItem } from "../types";
import { MarkdownEditor } from "./MarkdownEditor";

interface NoteWorkspaceProps {
  note: NoteItem | null;
  draftNote?: NoteItem | null;
  isDraftRecovered?: boolean;
  userEmail: string;
  isCompact?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
  mutationErrorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  onCreateNote?: (
    draft: Pick<NoteItem, "title" | "content" | "tags" | "isPinned" | "kind">,
  ) => Promise<void> | void;
  onDraftChange?: (draft: NoteItem) => void;
  onDiscardDraft?: () => void;
  onUpdateNote?: (updated: NoteItem) => Promise<void> | void;
  onDeleteNote?: (id: string) => Promise<void> | void;
  onTogglePin?: (note: NoteItem) => Promise<void> | void;
}

function parseTags(tagsInput: string) {
  return [
    ...new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function NoteWorkspace({
  note,
  draftNote = null,
  isDraftRecovered = false,
  userEmail,
  isCompact = false,
  isLoading = false,
  isSaving = false,
  isDeleting = false,
  errorMessage = null,
  mutationErrorMessage = null,
  onRetry,
  onBack,
  onCreateNote,
  onDraftChange,
  onDiscardDraft,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
}: NoteWorkspaceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isPreviewingMarkdown, setIsPreviewingMarkdown] = useState(true);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editContent, setEditContent] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const lastHydratedKeyRef = useRef<string | null>(null);
  const lastFocusedKeyRef = useRef<string | null>(null);

  const activeNote = draftNote ?? note;
  const isDraftMode = Boolean(draftNote);

  const normalizedTags = useMemo(() => parseTags(editTags), [editTags]);

  useEffect(() => {
    if (!activeNote) {
      lastHydratedKeyRef.current = null;
      setIsEditing(false);
      setHasRecoveredDraft(false);
      setIsDeleteDialogOpen(false);
      setIsDiscardDialogOpen(false);
      setIsPreviewingMarkdown(false);
      setTitleError(null);
      return;
    }

    const hydrationKey = draftNote
      ? `draft:${draftNote.id}`
      : `note:${activeNote.id}:${activeNote.updatedAt}`;

    if (lastHydratedKeyRef.current === hydrationKey) {
      return;
    }

    lastHydratedKeyRef.current = hydrationKey;

    if (draftNote) {
      setEditTitle(draftNote.title);
      setEditTags(draftNote.tags.join(", "));
      setEditContent(draftNote.content);
      setHasRecoveredDraft(isDraftRecovered);
      setIsPreviewingMarkdown(true);
      setIsEditing(true);
      setTitleError(null);
      return;
    }

    const storedDraft = loadExistingDraft(userEmail, activeNote.id);

    if (storedDraft) {
      setEditTitle(storedDraft.title);
      setEditTags(storedDraft.tags.join(", "));
      setEditContent(storedDraft.content);
      setHasRecoveredDraft(true);
      setIsPreviewingMarkdown(true);
      setIsEditing(true);
      setTitleError(null);
      return;
    }

    setEditTitle(activeNote.title);
    setEditTags(activeNote.tags.join(", "));
    setEditContent(activeNote.content);
    setHasRecoveredDraft(false);
    setIsPreviewingMarkdown(true);
    setIsEditing(false);
    setTitleError(null);
  }, [activeNote, draftNote, isDraftRecovered, userEmail]);

  useEffect(() => {
    if (!activeNote || !isEditing || (isDraftMode && isSaving)) {
      return;
    }

    if (isDraftMode) {
      const hasDraftChanges =
        editTitle !== activeNote.title ||
        editContent !== activeNote.content ||
        normalizedTags.join(",") !== activeNote.tags.join(",");

      if (!hasDraftChanges) {
        return;
      }

      onDraftChange?.({
        ...activeNote,
        title: editTitle,
        content: editContent,
        tags: normalizedTags,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const hasChanges =
      editTitle !== activeNote.title ||
      editContent !== activeNote.content ||
      normalizedTags.join(",") !== activeNote.tags.join(",");

    if (!hasChanges) {
      clearExistingDraft(userEmail, activeNote.id);
      return;
    }

    saveExistingDraft(userEmail, activeNote.id, {
      title: editTitle,
      content: editContent,
      tags: normalizedTags,
      isPinned: activeNote.isPinned,
      kind: activeNote.kind,
      createdAt: activeNote.createdAt,
      updatedAt: new Date().toISOString(),
      version: activeNote.version,
    });
  }, [
    activeNote,
    editContent,
    editTitle,
    isDraftMode,
    isEditing,
    isSaving,
    normalizedTags,
    onDraftChange,
    userEmail,
  ]);

  useEffect(() => {
    if (!activeNote || !isEditing) {
      lastFocusedKeyRef.current = null;
      return;
    }

    const focusKey = `${isDraftMode ? "draft" : "note"}:${activeNote.id}:editing`;

    if (lastFocusedKeyRef.current === focusKey) {
      return;
    }

    lastFocusedKeyRef.current = focusKey;
  }, [activeNote, isDraftMode, isEditing]);

  useEffect(() => {
    if (!isDeleteDialogOpen) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        setIsDeleteDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDeleteDialogOpen, isDeleting]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-8 sm:py-8">
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-32 w-full animate-pulse rounded bg-white/5" />
          <div className="h-48 w-full animate-pulse rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-background p-6 text-center sm:p-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">Nao foi possivel carregar suas notas</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <Button type="button" variant="primary" size="sm" onClick={onRetry} className="mt-4">
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className="flex h-full min-h-0 flex-1 select-none flex-col items-center justify-center bg-background p-6 text-center text-muted-foreground sm:p-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground/60">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma nota selecionada</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Clique em "Nova Nota" para abrir um rascunho local ou selecione uma nota existente.
        </p>
      </div>
    );
  }

  const handleCopyContent = () => {
    if (activeNote.content) {
      navigator.clipboard.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeNote || isDraftMode) {
      return;
    }

    await onDeleteNote?.(activeNote.id);
    setIsDeleteDialogOpen(false);
  };

  const resetToOriginalState = () => {
    if (draftNote) {
      setEditTitle(draftNote.title);
      setEditTags(draftNote.tags.join(", "));
      setEditContent(draftNote.content);
      setIsPreviewingMarkdown(true);
      setIsDiscardDialogOpen(false);
      setIsEditing(false);
      setTitleError(null);
      return;
    }

    if (!note) {
      return;
    }

    clearExistingDraft(userEmail, note.id);
    setEditTitle(note.title);
    setEditTags(note.tags.join(", "));
    setEditContent(note.content);
    setHasRecoveredDraft(false);
    setIsDiscardDialogOpen(false);
    setIsPreviewingMarkdown(true);
    setIsEditing(false);
    setTitleError(null);
  };

  const executeDiscardDraft = () => {
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setIsEditing(false);
    setHasRecoveredDraft(false);
    setIsPreviewingMarkdown(true);
    setTitleError(null);
    setIsDiscardDialogOpen(false);
    lastHydratedKeyRef.current = null;
    lastFocusedKeyRef.current = null;
    onDiscardDraft?.();
  };

  const handleDiscardDraftClick = () => {
    const hasContent = Boolean(editTitle.trim() || editContent.trim() || editTags.trim());

    if (!hasContent) {
      executeDiscardDraft();
      return;
    }

    setIsDiscardDialogOpen(true);
  };

  const handleBackNavigation = () => {
    if (isDraftMode) {
      handleDiscardDraftClick();
      return;
    }

    if (isEditing) {
      resetToOriginalState();
    }

    onBack?.();
  };

  const handleReadingCheckboxChange = (event: React.FormEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const checkbox =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target
        : target
            .closest("li.task-list-item")
            ?.querySelector<HTMLInputElement>('input[type="checkbox"]');

    if (checkbox) {
      event.preventDefault();
      const container = event.currentTarget;
      const allCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
      const index = allCheckboxes.indexOf(checkbox);
      if (index !== -1 && activeNote.content) {
        const nextContent = toggleMarkdownCheckbox(activeNote.content, index);
        if (note && onUpdateNote) {
          void onUpdateNote({ ...note, content: nextContent });
        } else if (isDraftMode && onDraftChange && draftNote) {
          onDraftChange({ ...draftNote, content: nextContent });
        }
      }
    }
  };

  const salvarNota = async () => {
    const sanitizedTitle = editTitle.trim();

    if (!sanitizedTitle) {
      setTitleError("Informe um titulo antes de salvar a nota.");
      titleInputRef.current?.focus();
      return;
    }

    const payload = {
      title: sanitizedTitle,
      content: editContent,
      tags: normalizedTags,
      isPinned: activeNote.isPinned,
      kind: activeNote.kind,
    };

    if (isDraftMode) {
      await onCreateNote?.(payload);
      setHasRecoveredDraft(false);
      setIsEditing(false);
      return;
    }

    if (!note || !onUpdateNote) {
      return;
    }

    await onUpdateNote({
      ...note,
      ...payload,
    });

    clearExistingDraft(userEmail, note.id);
    setHasRecoveredDraft(false);
    setIsEditing(false);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    await salvarNota();
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header
        className={cn(
          "flex shrink-0 items-center justify-between border-b border-border/40 bg-card/20",
          isCompact ? "safe-top px-4 py-3" : "px-6 py-2.5",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {isCompact && onBack && (
            <button
              type="button"
              onClick={handleBackNavigation}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
              title="Voltar para lista"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/80">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            {isDraftMode ? "Rascunho local" : isEditing ? "Editando" : "Leitura"}
          </span>
          {hasRecoveredDraft && (
            <span className="text-[11px] font-mono text-primary/80">Conteudo recuperado</span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-mono">
          {!isEditing ? (
            <>
              {activeNote.content && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  className="h-8 gap-1 px-2.5 text-[11px] font-mono sm:h-7"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 gap-1 px-2.5 text-[11px] font-mono sm:h-7"
              >
                <Edit3 className="h-3 w-3" />
                <span>{isDraftMode ? "Continuar" : "Editar"}</span>
              </Button>

              {!isDraftMode && (
                <>
                  <button
                    type="button"
                    onClick={() => onTogglePin?.(activeNote)}
                    disabled={isSaving}
                    className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    title={activeNote.isPinned ? "Desafixar nota" : "Fixar nota"}
                  >
                    <Pin
                      className={cn(
                        "h-3.5 w-3.5",
                        activeNote.isPinned && "rotate-45 fill-primary/20 text-primary",
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="cursor-pointer rounded p-1.5 text-rose-400/80 transition-colors hover:bg-rose-500/15 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Excluir nota"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {isDraftMode && onDiscardDraft && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardDraftClick}
                  className="h-8 gap-1 border-rose-500/30 px-2.5 text-[11px] font-mono text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 sm:h-7"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Descartar</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetToOriginalState}
                className="h-8 gap-1 px-2.5 text-[11px] font-mono sm:h-7"
              >
                <X className="h-3 w-3" />
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                onClick={() => {
                  void salvarNota();
                }}
                className="h-8 gap-1 px-2.5 text-[11px] font-mono sm:h-7"
              >
                <Save className="h-3 w-3" />
                <span>{isDraftMode ? "Salvar Nota" : "Salvar"}</span>
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        {mutationErrorMessage && (
          <div className="mx-4 mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 sm:mx-6 sm:mt-6">
            {mutationErrorMessage}
          </div>
        )}

        {!isEditing ? (
          <div className="flex-1 overflow-y-auto">
            <article className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              {activeNote.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-border/60 bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3 border-b border-border/40 pb-5">
                <h1 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
                  {activeNote.title || "Nova anotacao"}
                </h1>
                <div className="flex items-center space-x-3 text-xs font-mono text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatNoteWorkspaceTimestamp(activeNote.createdAt, activeNote.updatedAt)}
                  </span>
                </div>
              </div>

              {activeNote.content ? (
                <div
                  className="min-h-[45vh] rounded-2xl border border-border/50 bg-card/30 p-4 selection:bg-primary/20 sm:min-h-[55vh] sm:p-5"
                  data-color-mode="dark"
                  onChange={handleReadingCheckboxChange}
                >
                  <MarkdownPreview
                    source={formatMarkdownForPreview(activeNote.content)}
                    className="devnote-reading-content"
                    skipHtml
                    rehypeRewrite={(node) => {
                      if (
                        node.type === "element" &&
                        node.tagName === "input" &&
                        node.properties?.type === "checkbox"
                      ) {
                        delete node.properties.disabled;
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="min-h-[45vh] w-full cursor-pointer rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:min-h-[55vh] sm:p-8"
                >
                  Esta nota esta pronta para escrever. Clique aqui e continue do ponto em que voce
                  parou.
                </button>
              )}
            </article>
          </div>
        ) : (
          <form
            onSubmit={(event) => void handleSave(event)}
            className="flex h-full flex-col overflow-hidden"
          >
            <div
              className={cn(
                "border-b border-border/40 bg-card/20",
                isCompact ? "px-4 py-4" : "px-6 py-6 lg:px-8",
              )}
            >
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                <div className="space-y-2">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(event) => {
                      setEditTitle(event.target.value);

                      if (titleError && event.target.value.trim()) {
                        setTitleError(null);
                      }
                    }}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                        event.preventDefault();
                        void salvarNota();
                      }
                    }}
                    placeholder="Nova anotacao"
                    className={cn(
                      "w-full rounded-2xl border bg-card/50 px-4 py-3 text-2xl font-semibold tracking-[-0.03em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 sm:text-3xl lg:text-4xl",
                      titleError
                        ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-border/60 focus:border-primary focus:ring-primary/40",
                    )}
                  />
                  {titleError && <p className="text-xs text-rose-300">{titleError}</p>}
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="space-y-2">
                    <label
                      htmlFor="note-tags"
                      className="text-[11px] font-mono font-semibold text-muted-foreground"
                    >
                      Tags opcionais
                    </label>
                    <input
                      id="note-tags"
                      type="text"
                      value={editTags}
                      onChange={(event) => setEditTags(event.target.value)}
                      placeholder="ex: docker, postgres, backend"
                      className="w-full rounded-xl border border-border/60 bg-input px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end text-[11px] font-mono text-muted-foreground/70">
                  <span>Ctrl + Enter salva</span>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex-1 overflow-hidden",
                isCompact ? "px-4 py-4" : "px-6 py-6 lg:px-8",
              )}
            >
              <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
                <MarkdownEditor
                  id="note-content"
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Escreva em markdown. Digite / para ver atalhos de formatação."
                  onSave={() => void salvarNota()}
                  showPreview={isPreviewingMarkdown}
                />
              </div>
            </div>

            <div
              className={cn(
                "border-t border-border/40 bg-card/30",
                isCompact ? "safe-bottom px-4 py-3" : "px-6 py-3 lg:px-8",
              )}
            >
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] font-mono text-muted-foreground/70">
                  {isDraftMode
                    ? "Rascunho local ativo ate voce salvar."
                    : "Rascunho local protegido durante a edicao."}
                </p>
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant={isPreviewingMarkdown ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setIsPreviewingMarkdown((current) => !current)}
                    className={cn(
                      "text-xs font-mono transition-colors",
                      isPreviewingMarkdown &&
                        "border border-white/15 bg-white/10 font-semibold text-foreground",
                    )}
                  >
                    {isPreviewingMarkdown ? "Ocultar preview" : "Preview markdown"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Excluir anotacao"
        description={
          <>
            Deseja excluir essa nota{" "}
            <span className="font-semibold text-foreground">
              {activeNote.title || "Sem titulo"}
            </span>
            ?
          </>
        }
        confirmLabel="Excluir nota"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={isDiscardDialogOpen}
        title="Descartar rascunho"
        description={
          <>
            Deseja descartar as alteracoes deste rascunho? Todo o conteudo preenchido sera perdido
            permanentemente.
          </>
        }
        confirmLabel="Descartar rascunho"
        cancelLabel="Continuar editando"
        onCancel={() => setIsDiscardDialogOpen(false)}
        onConfirm={executeDiscardDraft}
      />
    </div>
  );
}
