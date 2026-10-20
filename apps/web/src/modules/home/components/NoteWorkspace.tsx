import * as React from "react";
import { useState, useEffect } from "react";
import {
  Pin,
  Edit3,
  Calendar,
  Trash2,
  Save,
  X,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import type { NoteItem } from "../types";
import { Button } from "../../../components/ui/button";

interface NoteWorkspaceProps {
  note: NoteItem | null;
  onUpdateNote?: (updated: NoteItem) => void;
  onDeleteNote?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export function NoteWorkspace({
  note,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
}: NoteWorkspaceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estado do formulário de edição
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editContent, setEditContent] = useState("");

  // Sincroniza formulário com a nota selecionada
  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditTags(note.tags.join(", "));
      setEditContent(note.content || "");
      setIsEditing(false);
    }
  }, [note]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground p-8 text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-3 text-muted-foreground/60">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma nota selecionada</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Selecione uma nota na lista ao lado ou crie uma nova para começar a anotar.
        </p>
      </div>
    );
  }

  const handleCopyContent = () => {
    if (note.content) {
      navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateNote) return;

    const parsedTags = editTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const updated: NoteItem = {
      ...note,
      title: editTitle.trim() || "Sem título",
      tags: parsedTags,
      content: editContent,
      updatedAt: "Agora",
    };

    onUpdateNote(updated);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background overflow-hidden">
      {/* Barra superior de ações */}
      <header className="border-b border-border/40 px-6 py-2.5 flex items-center justify-between bg-card/20 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-muted-foreground/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {isEditing ? "Editando" : "Leitura"}
          </span>
        </div>

        {/* Controles de ação */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {!isEditing ? (
            <>
              {note.content && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyContent}
                  className="h-7 text-[11px] gap-1 px-2.5 font-mono"
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
                className="h-7 text-[11px] gap-1 px-2.5 font-mono"
              >
                <Edit3 className="h-3 w-3" />
                <span>Editar</span>
              </Button>

              <button
                type="button"
                onClick={() => onTogglePin?.(note.id)}
                className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title={note.isPinned ? "Desafixar nota" : "Fixar nota"}
              >
                <Pin
                  className={`h-3.5 w-3.5 ${
                    note.isPinned ? "text-primary fill-primary/20 rotate-45" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir esta anotação?")) {
                    onDeleteNote?.(note.id);
                  }
                }}
                className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 cursor-pointer transition-colors"
                title="Excluir nota"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-7 text-[11px] gap-1 px-2.5 font-mono"
              >
                <X className="h-3 w-3" />
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="h-7 text-[11px] gap-1 px-2.5 font-mono"
              >
                <Save className="h-3 w-3" />
                <span>Salvar</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Área de conteúdo */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl w-full mx-auto">
        {!isEditing ? (
          /* MODO VISUALIZAÇÃO */
          <article className="space-y-6">
            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {note.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-border/60 text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Cabeçalho da Nota */}
            <div className="space-y-2 border-b border-border/40 pb-4">
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                {note.title}
              </h1>
              <div className="flex items-center space-x-3 text-xs font-mono text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {note.updatedAt}
                </span>
              </div>
            </div>

            {/* Conteúdo Livre */}
            {note.content ? (
              <div className="text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap selection:bg-primary/20">
                {note.content}
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsEditing(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
                className="p-8 border border-dashed border-border/60 rounded-lg text-center text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground cursor-pointer transition-colors"
              >
                Esta nota está vazia. Clique aqui para escrever suas anotações livres.
              </div>
            )}
          </article>
        ) : (
          /* MODO EDIÇÃO */
          <form onSubmit={handleSave} className="space-y-5 pb-8">
            <div className="space-y-1.5">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título da anotação..."
                className="w-full px-3 py-2 text-xl font-bold bg-transparent border-b border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="ex: docker, comandos, backend"
                className="w-full px-3 py-1.5 text-xs font-mono bg-input border border-border/60 rounded-md text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                Conteúdo livre
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Escreva livremente aqui... ideias, comandos, anotações de estudo ou resoluções rápidas."
                rows={18}
                className="w-full p-4 text-sm font-sans leading-relaxed bg-input/40 border border-border/60 rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-y"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Salvar Nota
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
