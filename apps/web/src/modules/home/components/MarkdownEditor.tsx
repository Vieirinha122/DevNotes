import MarkdownPreview from "@uiw/react-markdown-preview";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Quote,
} from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { formatMarkdownForPreview, toggleMarkdownCheckbox } from "../notes.utils";

/* ──────────────────────────────────────────────
   Tipos e constantes
   ────────────────────────────────────────────── */

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  insert: (textarea: HTMLTextAreaElement) => void;
}

interface ToolbarAction {
  id: string;
  label: string;
  title: string;
  icon: React.ReactNode;
  apply: (textarea: HTMLTextAreaElement) => void;
}

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSave?: () => void;
  showPreview?: boolean;
}

/* ──────────────────────────────────────────────
   Helpers — manipulação de texto no cursor
   ────────────────────────────────────────────── */

function getLineRange(text: string, cursorPos: number) {
  const lineStart = text.lastIndexOf("\n", cursorPos - 1) + 1;
  let lineEnd = text.indexOf("\n", cursorPos);
  if (lineEnd === -1) lineEnd = text.length;
  return { lineStart, lineEnd };
}

/** Insere `prefix` no começo da linha onde o cursor está */
function insertLinePrefix(textarea: HTMLTextAreaElement, prefix: string) {
  const { value, selectionStart } = textarea;
  const { lineStart, lineEnd } = getLineRange(value, selectionStart);
  const currentLine = value.slice(lineStart, lineEnd);

  const newLine = prefix + currentLine;
  const next = value.slice(0, lineStart) + newLine + value.slice(lineEnd);

  applyValue(textarea, next, lineStart + prefix.length + currentLine.length);
}

/** Envolve o texto selecionado com `wrap` (ex: `**`, `_`) */
function wrapSelection(textarea: HTMLTextAreaElement, wrap: string, placeholder: string) {
  const { value, selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);

  const inner = selected || placeholder;
  const replacement = `${wrap}${inner}${wrap}`;

  const next = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);
  const cursorAfter = selected ? selectionStart + replacement.length : selectionStart + wrap.length;
  const selEnd = selected
    ? selectionStart + replacement.length
    : selectionStart + wrap.length + inner.length;

  applyValue(textarea, next, cursorAfter, selEnd);
}

/** Insere um bloco de código */
function insertCodeBlock(textarea: HTMLTextAreaElement) {
  const { value, selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const inner = selected || "codigo";

  const needsNewlineBefore = selectionStart > 0 && value[selectionStart - 1] !== "\n";
  const prefix = needsNewlineBefore ? "\n" : "";
  const block = `${prefix}\`\`\`\n${inner}\n\`\`\`\n`;

  const next = value.slice(0, selectionStart) + block + value.slice(selectionEnd);
  const cursorPos = selectionStart + prefix.length + 4; // after ```\n

  applyValue(textarea, next, cursorPos, cursorPos + inner.length);
}

/** Substitui uma fatia da linha atual (remove o trigger `/comando`) e insere o prefixo */
function replaceSlashAndInsert(textarea: HTMLTextAreaElement, slashStart: number, prefix: string) {
  const { value } = textarea;
  const { lineEnd } = getLineRange(value, slashStart);
  const afterSlash = value.slice(slashStart, lineEnd);

  // Remove tudo do / até o fim da "palavra" do slash
  const endOfSlashWord = slashStart + afterSlash.length;
  const next = value.slice(0, slashStart) + prefix + value.slice(endOfSlashWord);
  const cursorPos = slashStart + prefix.length;

  applyValue(textarea, next, cursorPos);
}

/** Aplica valor e reposiciona o cursor (próximo tick para garantir re-render React) */
function applyValue(
  textarea: HTMLTextAreaElement,
  value: string,
  cursorStart: number,
  cursorEnd?: number,
) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  nativeInputValueSetter?.call(textarea, value);

  textarea.dispatchEvent(new Event("input", { bubbles: true }));

  requestAnimationFrame(() => {
    textarea.setSelectionRange(cursorStart, cursorEnd ?? cursorStart);
    textarea.focus();
  });
}

/* ──────────────────────────────────────────────
   Definições de slash commands
   ────────────────────────────────────────────── */

function buildSlashCommands(): SlashCommand[] {
  return [
    {
      id: "heading1",
      label: "Título",
      description: "Título principal",
      icon: <Heading1 className="h-4 w-4" />,
      insert: (ta) => replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "# "),
    },
    {
      id: "heading2",
      label: "Subtítulo",
      description: "Subtítulo secundário",
      icon: <Heading2 className="h-4 w-4" />,
      insert: (ta) => replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "## "),
    },
    {
      id: "bulletList",
      label: "Lista",
      description: "Lista com marcadores",
      icon: <List className="h-4 w-4" />,
      insert: (ta) => replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "- "),
    },
    {
      id: "orderedList",
      label: "Lista numerada",
      description: "Lista ordenada",
      icon: <ListOrdered className="h-4 w-4" />,
      insert: (ta) => replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "1. "),
    },
    {
      id: "checklist",
      label: "Checklist",
      description: "Lista com checkbox",
      icon: <ListChecks className="h-4 w-4" />,
      insert: (ta) => replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "- [ ] "),
    },
    {
      id: "bold",
      label: "Negrito",
      description: "Texto em negrito",
      icon: <Bold className="h-4 w-4" />,
      insert: (ta) => {
        replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "");
        requestAnimationFrame(() => wrapSelection(ta, "**", "texto"));
      },
    },
    {
      id: "italic",
      label: "Itálico",
      description: "Texto em itálico",
      icon: <Italic className="h-4 w-4" />,
      insert: (ta) => {
        replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "");
        requestAnimationFrame(() => wrapSelection(ta, "_", "texto"));
      },
    },
    {
      id: "quote",
      label: "Citação",
      description: "Bloco de citação",
      icon: <Quote className="h-4 w-4" />,
      insert: (ta) => replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "> "),
    },
    {
      id: "codeBlock",
      label: "Código",
      description: "Bloco de código",
      icon: <Code2 className="h-4 w-4" />,
      insert: (ta) => {
        replaceSlashAndInsert(ta, ta.__slashStart ?? 0, "");
        requestAnimationFrame(() => insertCodeBlock(ta));
      },
    },
  ];
}

/* ──────────────────────────────────────────────
   Definições da toolbar
   ────────────────────────────────────────────── */

const ICON_SIZE = "h-3.5 w-3.5";

function buildToolbarActions(): ToolbarAction[] {
  return [
    {
      id: "heading1",
      label: "H1",
      title: "Título principal",
      icon: <Heading1 className={ICON_SIZE} />,
      apply: (ta) => insertLinePrefix(ta, "# "),
    },
    {
      id: "heading2",
      label: "H2",
      title: "Subtítulo",
      icon: <Heading2 className={ICON_SIZE} />,
      apply: (ta) => insertLinePrefix(ta, "## "),
    },
    {
      id: "bold",
      label: "B",
      title: "Negrito (Ctrl+B)",
      icon: <Bold className={ICON_SIZE} />,
      apply: (ta) => wrapSelection(ta, "**", "texto"),
    },
    {
      id: "italic",
      label: "I",
      title: "Itálico (Ctrl+I)",
      icon: <Italic className={ICON_SIZE} />,
      apply: (ta) => wrapSelection(ta, "_", "texto"),
    },
    {
      id: "bulletList",
      label: "Lista",
      title: "Lista com marcadores",
      icon: <List className={ICON_SIZE} />,
      apply: (ta) => insertLinePrefix(ta, "- "),
    },
    {
      id: "orderedList",
      label: "1.",
      title: "Lista ordenada",
      icon: <ListOrdered className={ICON_SIZE} />,
      apply: (ta) => insertLinePrefix(ta, "1. "),
    },
    {
      id: "checklist",
      label: "☐",
      title: "Checklist",
      icon: <ListChecks className={ICON_SIZE} />,
      apply: (ta) => insertLinePrefix(ta, "- [ ] "),
    },
    {
      id: "quote",
      label: ">",
      title: "Citação",
      icon: <Quote className={ICON_SIZE} />,
      apply: (ta) => insertLinePrefix(ta, "> "),
    },
    {
      id: "codeBlock",
      label: "</>",
      title: "Bloco de código",
      icon: <Code2 className={ICON_SIZE} />,
      apply: (ta) => insertCodeBlock(ta),
    },
  ];
}

/* ──────────────────────────────────────────────
   Hack: extendemos o type do textarea para
   armazenar a posição onde o `/` foi digitado
   ────────────────────────────────────────────── */

declare global {
  interface HTMLTextAreaElement {
    __slashStart?: number;
  }
}

/* ──────────────────────────────────────────────
   Componente principal
   ────────────────────────────────────────────── */

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  onSave,
  showPreview = false,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const [slashMenu, setSlashMenu] = useState<{
    open: boolean;
    query: string;
    position: { top: number; left: number };
    slashStart: number;
  }>({ open: false, query: "", position: { top: 0, left: 0 }, slashStart: 0 });
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  const slashCommands = useRef(buildSlashCommands()).current;
  const toolbarActions = useRef(buildToolbarActions()).current;

  const filteredSlashCommands = slashMenu.open
    ? slashCommands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(slashMenu.query.toLowerCase()),
      )
    : [];
  const activeSlashCommandId = filteredSlashCommands[slashSelectedIndex]?.id ?? null;

  /* ── Auto-resize textarea ── */

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  });

  /* ── Fecha slash menu ao clicar fora ── */

  useEffect(() => {
    if (!slashMenu.open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(event.target as Node)) {
        setSlashMenu((prev) => ({ ...prev, open: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashMenu.open]);

  /* ── Calcula posição do slash menu relativa ao cursor no textarea ── */

  const getCaretCoordinates = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return { top: 0, left: 0 };

    const mirror = document.createElement("div");
    const computed = getComputedStyle(ta);

    const properties = [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "letterSpacing",
      "wordSpacing",
      "textIndent",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "boxSizing",
      "whiteSpace",
      "wordWrap",
      "overflowWrap",
    ] as const;

    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.overflow = "hidden";
    mirror.style.width = `${ta.offsetWidth}px`;

    for (const prop of properties) {
      mirror.style[prop] = computed[prop];
    }

    const textBeforeCursor = ta.value.slice(0, ta.selectionStart);
    const textNode = document.createTextNode(textBeforeCursor);
    const span = document.createElement("span");
    span.textContent = "|";

    mirror.appendChild(textNode);
    mirror.appendChild(span);
    document.body.appendChild(mirror);

    const rect = ta.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    const top = rect.top + (spanRect.top - mirrorRect.top) - ta.scrollTop + 24;
    const left = rect.left + (spanRect.left - mirrorRect.left) - ta.scrollLeft;

    document.body.removeChild(mirror);

    return { top, left };
  }, []);

  /* ── Handler de input: detecta atalhos automáticos e `/` para abrir o slash menu ── */

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const { value: currentValue, selectionStart } = ta;
    const { lineStart } = getLineRange(currentValue, selectionStart);
    const lineUpToCursor = currentValue.slice(lineStart, selectionStart);

    // Atalho automático: digitar `[] ` ou `[ ] ` no começo da linha vira `- [ ] `
    if (lineUpToCursor === "[] " || lineUpToCursor === "[ ] ") {
      const next = currentValue.slice(0, lineStart) + "- [ ] " + currentValue.slice(selectionStart);
      applyValue(ta, next, lineStart + 6);
      return;
    }

    // Atalho automático: digitar `* ` no começo da linha vira `- `
    if (lineUpToCursor === "* ") {
      const next = currentValue.slice(0, lineStart) + "- " + currentValue.slice(selectionStart);
      applyValue(ta, next, lineStart + 2);
      return;
    }

    if (slashMenu.open) {
      const query = currentValue.slice(slashMenu.slashStart + 1, selectionStart);

      if (query.includes(" ") || query.includes("\n") || selectionStart <= slashMenu.slashStart) {
        setSlashMenu((prev) => ({ ...prev, open: false }));
      } else {
        setSlashMenu((prev) => ({ ...prev, query }));
        setSlashSelectedIndex(0);
      }
      return;
    }

    // Detecta se o caracter antes do cursor é `/` no começo da linha
    if (selectionStart >= 1 && currentValue[selectionStart - 1] === "/") {
      const charBefore = selectionStart >= 2 ? currentValue[selectionStart - 2] : "\n";
      if (charBefore === "\n" || selectionStart - 1 === 0) {
        const position = getCaretCoordinates();
        ta.__slashStart = selectionStart - 1;
        setSlashMenu({
          open: true,
          query: "",
          position,
          slashStart: selectionStart - 1,
        });
        setSlashSelectedIndex(0);
      }
    }
  }, [slashMenu.open, slashMenu.slashStart, getCaretCoordinates]);

  /* ── Seleciona um slash command ── */

  const selectSlashCommand = useCallback(
    (command: SlashCommand) => {
      const ta = textareaRef.current;
      if (!ta) return;

      ta.__slashStart = slashMenu.slashStart;
      command.insert(ta);
      setSlashMenu((prev) => ({ ...prev, open: false }));
    },
    [slashMenu.slashStart],
  );

  /* ── Keyboard handler ── */

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;

      // Ctrl+Enter = salvar
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        onSave?.();
        return;
      }

      // Ctrl+B = negrito
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        wrapSelection(ta, "**", "texto");
        return;
      }

      // Ctrl+I = itálico
      if ((event.ctrlKey || event.metaKey) && event.key === "i") {
        event.preventDefault();
        wrapSelection(ta, "_", "texto");
        return;
      }

      // Navegação do slash menu
      if (slashMenu.open && filteredSlashCommands.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashSelectedIndex((prev) => (prev + 1) % filteredSlashCommands.length);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashSelectedIndex(
            (prev) => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length,
          );
          return;
        }

        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          selectSlashCommand(filteredSlashCommands[slashSelectedIndex]);
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setSlashMenu((prev) => ({ ...prev, open: false }));
          return;
        }
      }

      // Continuação inteligente de listas com Enter
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const { lineStart, lineEnd } = getLineRange(ta.value, ta.selectionStart);
        const currentLine = ta.value.slice(lineStart, lineEnd);

        // Caso 1: Checklist (- [ ] ou - [x])
        const taskMatch = currentLine.match(/^(\s*[-*+]\s+\[[ xX]\]\s*)(.*)$/);
        if (taskMatch) {
          event.preventDefault();
          const [, prefix, content] = taskMatch;
          // Se linha vazia (apenas o checkbox): remove o checkbox da linha e sai da lista
          if (!content.trim()) {
            const next = ta.value.slice(0, lineStart) + ta.value.slice(lineEnd);
            applyValue(ta, next, lineStart);
            return;
          }
          const indent = prefix.match(/^\s*/)?.[0] ?? "";
          const newPrefix = `\n${indent}- [ ] `;
          const next =
            ta.value.slice(0, ta.selectionStart) + newPrefix + ta.value.slice(ta.selectionEnd);
          applyValue(ta, next, ta.selectionStart + newPrefix.length);
          return;
        }

        // Caso 2: Lista numerada (1. , 2. etc.)
        const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (orderedMatch) {
          event.preventDefault();
          const [, indent, numStr, content] = orderedMatch;
          if (!content.trim()) {
            const next = ta.value.slice(0, lineStart) + ta.value.slice(lineEnd);
            applyValue(ta, next, lineStart);
            return;
          }
          const nextNum = parseInt(numStr, 10) + 1;
          const newPrefix = `\n${indent}${nextNum}. `;
          const next =
            ta.value.slice(0, ta.selectionStart) + newPrefix + ta.value.slice(ta.selectionEnd);
          applyValue(ta, next, ta.selectionStart + newPrefix.length);
          return;
        }

        // Caso 3: Lista com marcadores (- , * , + )
        const bulletMatch = currentLine.match(/^(\s*[-*+]\s+)(.*)$/);
        if (bulletMatch) {
          event.preventDefault();
          const [, prefix, content] = bulletMatch;
          if (!content.trim()) {
            const next = ta.value.slice(0, lineStart) + ta.value.slice(lineEnd);
            applyValue(ta, next, lineStart);
            return;
          }
          const indent = prefix.match(/^\s*/)?.[0] ?? "";
          const newPrefix = `\n${indent}- `;
          const next =
            ta.value.slice(0, ta.selectionStart) + newPrefix + ta.value.slice(ta.selectionEnd);
          applyValue(ta, next, ta.selectionStart + newPrefix.length);
          return;
        }
      }

      // Tab para indentar/desindentar listas e texto
      if (event.key === "Tab") {
        event.preventDefault();
        const { selectionStart, selectionEnd, value: curVal } = ta;
        const isShift = event.shiftKey;

        const firstLineStart = curVal.lastIndexOf("\n", selectionStart - 1) + 1;
        let lastLineEnd = curVal.indexOf("\n", selectionEnd);
        if (lastLineEnd === -1) lastLineEnd = curVal.length;

        const block = curVal.slice(firstLineStart, lastLineEnd);
        const lines = block.split("\n");

        if (isShift) {
          // Desindentar: remove até 2 espaços do começo de cada linha
          let removedFirstLine = 0;
          let totalRemoved = 0;

          const newLines = lines.map((line, idx) => {
            const match = line.match(/^ {1,2}/);
            const removeCount = match ? match[0].length : 0;
            if (idx === 0) removedFirstLine = removeCount;
            totalRemoved += removeCount;
            return line.slice(removeCount);
          });

          const next =
            curVal.slice(0, firstLineStart) + newLines.join("\n") + curVal.slice(lastLineEnd);
          const newStart = Math.max(firstLineStart, selectionStart - removedFirstLine);
          const newEnd = Math.max(newStart, selectionEnd - totalRemoved);
          applyValue(ta, next, newStart, newEnd);
        } else {
          // Indentar: adiciona 2 espaços no começo de cada linha
          const newLines = lines.map((line) => `  ${line}`);
          const next =
            curVal.slice(0, firstLineStart) + newLines.join("\n") + curVal.slice(lastLineEnd);
          const addedFirst = 2;
          const totalAdded = lines.length * 2;
          applyValue(ta, next, selectionStart + addedFirst, selectionEnd + totalAdded);
        }
        return;
      }
    },
    [slashMenu.open, filteredSlashCommands, slashSelectedIndex, selectSlashCommand, onSave],
  );

  /* ── Toolbar click handler ── */

  const handleToolbarClick = useCallback((action: ToolbarAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    action.apply(ta);
  }, []);

  /* ── Scroll do item ativo no slash menu ── */

  useEffect(() => {
    if (!slashMenu.open) return;

    const menu = slashMenuRef.current;
    if (!menu) return;

    const activeItem =
      activeSlashCommandId === null
        ? null
        : menu.querySelector(`[data-command-id='${activeSlashCommandId}']`);
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeSlashCommandId, slashMenu.open]);

  const handlePreviewClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
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
        if (index !== -1) {
          const next = toggleMarkdownCheckbox(value, index);
          onChange(next);
        }
      }
    },
    [value, onChange],
  );

  return (
    <div className="devnote-editor flex h-full flex-col">
      {/* ── Toolbar ── */}
      <div className="devnote-editor__toolbar">
        {toolbarActions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.title}
            className="devnote-editor__toolbar-btn"
            onMouseDown={(event) => {
              event.preventDefault(); // evita perder foco do textarea
              handleToolbarClick(action);
            }}
          >
            {action.icon}
          </button>
        ))}

        <span className="devnote-editor__toolbar-hint">
          Digite <kbd>/</kbd> para formatar
        </span>
      </div>

      {/* ── Textarea ── */}
      <div
        className={cn("devnote-editor__body", showPreview && "devnote-editor__body--with-preview")}
      >
        <div className="devnote-editor__pane">
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="devnote-editor__textarea"
            spellCheck={false}
            rows={1}
          />
        </div>

        {showPreview && (
          <div
            className="devnote-editor__preview-pane"
            data-color-mode="dark"
            onClick={handlePreviewClick}
          >
            <div className="devnote-editor__preview-header">Preview markdown</div>
            <MarkdownPreview
              source={formatMarkdownForPreview(value) || "_Nada para visualizar ainda._"}
              className="devnote-editor__preview-content"
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
        )}
      </div>

      {/* ── Slash menu ── */}
      {slashMenu.open && filteredSlashCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="devnote-slash-menu"
          style={{
            position: "fixed",
            top: slashMenu.position.top,
            left: slashMenu.position.left,
          }}
        >
          <div className="devnote-slash-menu__header">Formatação</div>
          {filteredSlashCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              type="button"
              data-active={index === slashSelectedIndex}
              data-command-id={cmd.id}
              className={cn(
                "devnote-slash-menu__item",
                index === slashSelectedIndex && "devnote-slash-menu__item--active",
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSlashCommand(cmd);
              }}
              onMouseEnter={() => setSlashSelectedIndex(index)}
            >
              <span className="devnote-slash-menu__icon">{cmd.icon}</span>
              <span className="devnote-slash-menu__text">
                <span className="devnote-slash-menu__label">{cmd.label}</span>
                <span className="devnote-slash-menu__desc">{cmd.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
