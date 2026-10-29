import { Bold, CheckSquare, Code, List, X } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmacaoDialog } from "@/components/ui/ConfirmacaoDialog";
import { DialogoInserirLink } from "@/components/ui/DialogoInserirLink";
import { MenuAcoesLink } from "@/components/ui/MenuAcoesLink";
import type { Note } from "@/hooks/api/useNotas";
import { cores, espacamento, radius } from "@/styles/tokens";
import { formatarTimestamp } from "@/utils/formatarData";
import { htmlParaMarkdown, markdownParaHtml } from "@/utils/htmlParaMarkdown";

interface FormularioNotaProps {
  /** Nota existente (edição) — undefined na criação */
  nota?: Note | null;
  /** Estado de fixação — controlado pela tela (state lifting pro header) */
  fixada: boolean;
  /** Submete o formulário pra tela pai (via ref.submeter) */
  onSubmit: (dados: { titulo: string; conteudo: string; tags: string[]; fixada: boolean }) => void;
  /** Loading do save — desativa inputs e toolbar */
  carregando?: boolean;
}

/** Handle exposto pra tela pai: submeter (Salvar) + estaSujo (dirty check pro cancelar). */
export interface FormularioNotaHandle {
  submeter: () => void;
  /** true se há algo digitado/diferente do inicial — usado pra confirmar descarte */
  estaSujo: boolean;
}

/**
 * Formulário compartilhado de criação/edição de nota (forwardRef).
 *
 * Direção visual: protótipo clean — tags inline acima do título,
 * title/content com label flutuante + bg surfaceStrong (borderless affordance),
 * toolbar de markdown fixa no footer com inserção real no cursor.
 *
 * Estado de Salvar/Fixar VIVE na tela pai (header), não aqui.
 * aqui só valida título, expõe submeter() e estaSujo.
 */
export const FormularioNota = forwardRef<FormularioNotaHandle, FormularioNotaProps>(
  function FormularioNota({ nota, fixada, onSubmit, carregando = false }, ref) {
    const insets = useSafeAreaInsets();
    const [titulo, setTitulo] = useState(nota?.title ?? "");
    const [tags, setTags] = useState<string[]>(nota?.tags ?? []);
    const [tagInput, setTagInput] = useState("");
    const [tituloFocado, setTituloFocado] = useState(false);
    const editorRef = useRef<RichEditor>(null);
    const [conteudoHtml, setConteudoHtml] = useState(
      nota ? markdownParaHtml(nota.content ?? "") : "<p></p>",
    );
    const [dialogRemoverTagVisivel, setDialogRemoverTagVisivel] = useState(false);
    const [tagParaRemover, setTagParaRemover] = useState<string | null>(null);
    const [dialogoLinkVisivel, setDialogoLinkVisivel] = useState(false);

    // Estados para controle de ações do link (abrir, editar, desvincular)
    const [linkSelecionado, setLinkSelecionado] = useState<{
      id: string;
      href: string;
      texto: string;
    } | null>(null);
    const [menuAcoesLinkVisivel, setMenuAcoesLinkVisivel] = useState(false);
    const [dialogoEditarLinkVisivel, setDialogoEditarLinkVisivel] = useState(false);

    // CSS Dark customizado injetado no WebView do editor:
    // - color-scheme: dark garante popups e menus contextuais do Android com texto claro
    // - Corrige fundo do <pre>/código (evita o cinza claro padrão do pell),
    // - Estiliza citação, listas e checkboxes com as cores e tokens do DevNotes.
    const editorCssText = `
      :root, html, body {
        color-scheme: dark;
      }
      pre {
        background-color: ${cores.surface} !important;
        border: 1px solid ${cores.border};
        border-radius: ${radius.md}px;
        padding: 12px;
        margin: 10px 0;
        overflow-x: auto;
      }
      code {
        font-family: monospace;
        font-size: 13px;
        color: ${cores.tagText};
      }
      pre code {
        background-color: transparent !important;
        color: ${cores.tagText} !important;
        padding: 0 !important;
      }
      blockquote {
        border-left: 3px solid ${cores.primary} !important;
        background-color: ${cores.surface};
        color: ${cores.foregroundMuted};
        padding: 8px 12px;
        margin: 10px 0;
        border-radius: 0 ${radius.sm}px ${radius.sm}px 0;
      }
      ul, ol {
        padding-left: 20px;
        margin: 8px 0;
      }
      li {
        margin-bottom: 6px;
        line-height: 22px;
      }
      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin-right: 8px;
        accent-color: ${cores.primary};
        cursor: pointer;
        vertical-align: middle;
      }
      a {
        color: ${cores.primary};
        text-decoration: underline;
      }
    `;

    // Script injetado para:
    // 1. Forçar dark color-scheme nativo no DOM do WebView e desativar spellcheck
    // 2. Tratar Enter em item vazio de lista/checkbox: sai da lista e cria parágrafo
    //    sem fechar o teclado virtual do Android.
    const scriptInicializacao = `
      (function() {
        if (document.documentElement) document.documentElement.style.colorScheme = 'dark';
        if (document.body) document.body.style.colorScheme = 'dark';

        var content = document.getElementById('content') || document.body;
        if (content) {
          content.spellcheck = false;
          content.setAttribute('spellcheck', 'false');
        }

        document.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.keyCode === 13) {
            var sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            var range = sel.getRangeAt(0);
            var node = range.startContainer;
            var li = node.nodeType === 1 ? node.closest('li') : (node.parentElement ? node.parentElement.closest('li') : null);

            if (li) {
              var clone = li.cloneNode(true);
              var inputs = clone.querySelectorAll('input, .x-todo-box');
              for (var i = 0; i < inputs.length; i++) inputs[i].remove();
              var texto = clone.textContent.replace(/[\\u200B-\\u200D\\uFEFF\\s]/g, '');

              // Se o item de lista/checkbox não tem texto digitado:
              if (!texto) {
                e.preventDefault();
                e.stopPropagation();

                var list = li.closest('ul') || li.closest('ol');
                li.remove();

                var p = document.createElement('p');
                p.innerHTML = '<br>';

                if (list && list.parentNode) {
                  if (list.children.length === 0) {
                    list.parentNode.replaceChild(p, list);
                  } else {
                    list.parentNode.insertBefore(p, list.nextSibling);
                  }
                } else {
                  document.body.appendChild(p);
                }

                var newRange = document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);

                var content = document.getElementById('content') || document.body;
                content.focus();

                if (window.Actions && window.Actions.UPDATE_HEIGHT) {
                  window.Actions.UPDATE_HEIGHT();
                }
                return false;
              }
            }
          }
        }, true);

        var linkCounter = 0;
        document.addEventListener('click', function(e) {
          var a = e.target.closest('a');
          if (a && a.getAttribute('href')) {
            e.preventDefault();
            e.stopPropagation();

            if (!a.getAttribute('data-link-id')) {
              linkCounter++;
              a.setAttribute('data-link-id', 'link_' + Date.now() + '_' + linkCounter);
            }

            var id = a.getAttribute('data-link-id');
            var href = a.getAttribute('href');
            var texto = a.textContent || '';

            var bridge = window.ReactNativeWebView || window.parent;
            if (bridge && bridge.postMessage) {
              bridge.postMessage(JSON.stringify({
                type: 'DEVNOTE_LINK_CLICK',
                data: { id: id, href: href, texto: texto }
              }));
            }
          }
        }, true);
      })();
      true;
    `;

    /** Expõe submeter() + estaSujo pro header da tela (state lifting). */
    useImperativeHandle(
      ref,
      () => ({
        submeter() {
          if (carregando) return; // trava double submit
          if (!titulo.trim()) {
            editorRef.current?.focusContentEditor(); // foca no editor rich
            return;
          }
          onSubmit({
            titulo: titulo.trim(),
            conteudo: htmlParaMarkdown(conteudoHtml), // HTML→markdown pro backend
            tags,
            fixada,
          });
        },
        // dirty check: converte HTML→md e compara com o markdown original
        estaSujo:
          titulo !== (nota?.title ?? "") ||
          htmlParaMarkdown(conteudoHtml) !== (nota?.content ?? "") ||
          JSON.stringify(tags) !== JSON.stringify(nota?.tags ?? []) ||
          fixada !== (nota?.isPinned ?? false),
      }),
      [titulo, conteudoHtml, tags, fixada, nota, carregando, onSubmit],
    );

    /** Abre diálogo de confirmação pra remover tag (ação destrutiva). */
    function abrirRemoverTag(tagRemover: string) {
      setTagParaRemover(tagRemover);
      setDialogRemoverTagVisivel(true);
    }

    /** Confirma remoção — fecha dialog e remove a tag. */
    function confirmarRemoverTag() {
      if (tagParaRemover) {
        setTags(tags.filter((t) => t !== tagParaRemover));
      }
      setTagParaRemover(null);
      setDialogRemoverTagVisivel(false);
    }

    function adicionarTag() {
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput("");
    }

    const timestamp = nota?.updatedAt ? formatarTimestamp(nota.updatedAt) : null;

    /** Abre link tocado no editor no navegador externo do celular. */
    async function handleAbrirLink(url: string) {
      if (!url) return;
      try {
        const urlFormatada = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        const suportado = await Linking.canOpenURL(urlFormatada);
        if (suportado) {
          await Linking.openURL(urlFormatada);
        }
      } catch (e) {
        console.warn("Não foi possível abrir o link:", url, e);
      }
    }

    /** Trata mensagens personalizadas vindas do WebView do editor */
    function handleWebViewMessage(message: any) {
      if (message && message.type === "DEVNOTE_LINK_CLICK" && message.data) {
        setLinkSelecionado(message.data);
        setMenuAcoesLinkVisivel(true);
      }
    }

    /** Ação: abrir o link selecionado no navegador */
    function handleAcaoAbrirLink() {
      if (linkSelecionado?.href) {
        handleAbrirLink(linkSelecionado.href);
      }
      setMenuAcoesLinkVisivel(false);
    }

    /** Ação: iniciar o diálogo de edição do link */
    function handleAcaoEditarLink() {
      setMenuAcoesLinkVisivel(false);
      setDialogoEditarLinkVisivel(true);
    }

    /** Ação: salvar alterações de texto e URL no link existente */
    function handleSalvarEdicaoLink(dados: { texto: string; url: string }) {
      if (!linkSelecionado) return;
      const id = linkSelecionado.id;
      const novoHref = JSON.stringify(dados.url);
      const novoTexto = JSON.stringify(dados.texto);

      editorRef.current?.injectJavascript(`
        (function() {
          var a = document.querySelector('a[data-link-id="${id}"]');
          if (a) {
            a.setAttribute('href', ${novoHref});
            a.textContent = ${novoTexto};
            if (window.Actions && window.Actions.UPDATE_HEIGHT) window.Actions.UPDATE_HEIGHT();
            var bridge = window.ReactNativeWebView || window.parent;
            if (bridge && bridge.postMessage) {
              bridge.postMessage(JSON.stringify({
                type: 'CONTENT_CHANGE',
                data: document.getElementById('content').innerHTML
              }));
            }
          }
        })();
        true;
      `);

      setDialogoEditarLinkVisivel(false);
      setLinkSelecionado(null);
    }

    /** Ação: desvincular o link mantendo o texto puro no editor */
    function handleAcaoRemoverLink() {
      if (!linkSelecionado) return;
      const id = linkSelecionado.id;

      editorRef.current?.injectJavascript(`
        (function() {
          var a = document.querySelector('a[data-link-id="${id}"]');
          if (a && a.parentNode) {
            var text = document.createTextNode(a.textContent || '');
            a.parentNode.replaceChild(text, a);
            if (window.Actions && window.Actions.UPDATE_HEIGHT) window.Actions.UPDATE_HEIGHT();
            var bridge = window.ReactNativeWebView || window.parent;
            if (bridge && bridge.postMessage) {
              bridge.postMessage(JSON.stringify({
                type: 'CONTENT_CHANGE',
                data: document.getElementById('content').innerHTML
              }));
            }
          }
        })();
        true;
      `);

      setMenuAcoesLinkVisivel(false);
      setLinkSelecionado(null);
    }

    return (
      <View
        style={[estilos.container, { paddingBottom: insets.bottom }]}
        pointerEvents={carregando ? "none" : "auto"}
      >
        {/* Tags inline + timestamp (meta bar) */}
        <View style={estilos.linhaMeta}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={estilos.linhaTagsScroll}
          >
            <View style={estilos.linhaTags}>
              {tags.map((tag) => (
                <View key={tag} style={estilos.tagChip}>
                  <Text style={estilos.tagChipTexto}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => abrirRemoverTag(tag)}
                    accessibilityLabel={`Remover tag ${tag}`}
                    hitSlop={8}
                  >
                    <X size={12} color={cores.foregroundMuted} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={estilos.tagInputWrapper}>
                <TextInput
                  style={estilos.inputTag}
                  placeholder="Adicionar tag..."
                  placeholderTextColor={cores.foregroundMutedForeground}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={adicionarTag}
                  editable={!carregando}
                  accessibilityLabel="Adicionar tag"
                  accessibilityHint="Digite uma tag e pressione enviar"
                />
              </View>
            </View>
          </ScrollView>
          {timestamp ? <Text style={estilos.timestamp}>{timestamp}</Text> : null}
        </View>

        {/* Título — label flutuante (heurística vault vs placeholder-only) */}
        <View style={estilos.fieldGroup}>
          <Text
            style={[
              estilos.label,
              tituloFocado || titulo ? estilos.labelAtiva : estilos.labelInativa,
            ]}
          >
            Título
          </Text>
          <TextInput
            style={estilos.inputTitulo}
            placeholder={tituloFocado || titulo ? "" : "Digite o título..."}
            placeholderTextColor={cores.foregroundMutedForeground}
            value={titulo}
            onChangeText={setTitulo}
            onFocus={() => setTituloFocado(true)}
            onBlur={() => setTituloFocado(false)}
            editable={!carregando}
            autoFocus
            accessibilityLabel="Título da nota"
            accessibilityHint="Digite um título para a nota"
          />
        </View>

        {/* Editor de conteúdo rich — label fixa + RichEditor (WebView) */}
        <View style={estilos.fieldGroupContent}>
          <Text style={[estilos.label, { color: cores.foregroundMuted }]}>Conteúdo</Text>
          <RichEditor
            ref={editorRef}
            initialContentHTML={conteudoHtml}
            onChange={setConteudoHtml}
            onLink={handleAbrirLink}
            onMessage={handleWebViewMessage}
            placeholder="Escreva em markdown..."
            useContainer={false}
            autoCorrect={false}
            editorInitializedCallback={() => {
              editorRef.current?.injectJavascript(scriptInicializacao);
            }}
            editorStyle={{
              backgroundColor: cores.surfaceStrong,
              color: cores.foreground,
              placeholderColor: cores.foregroundMutedForeground,
              caretColor: cores.primary,
              contentCSSText: "font-size: 15px; line-height: 22px;",
              cssText: editorCssText,
            }}
            style={estilos.editor}
            disabled={carregando}
          />
        </View>

        {/* Toolbar rich fixa no footer — checkbox real, negrito, lista, código, link custom */}
        <RichToolbar
          editor={editorRef}
          onInsertLink={() => setDialogoLinkVisivel(true)}
          actions={[
            actions.setBold,
            actions.checkboxList,
            actions.insertBulletsList,
            actions.code,
            actions.insertLink,
            actions.undo,
            actions.redo,
          ]}
          iconMap={(actionNome: string) => {
            switch (actionNome) {
              case actions.setBold:
                return <Bold size={20} color={cores.foregroundMuted} strokeWidth={1.5} />;
              case actions.checkboxList:
                return <CheckSquare size={20} color={cores.foregroundMuted} strokeWidth={1.5} />;
              case actions.insertBulletsList:
                return <List size={20} color={cores.foregroundMuted} strokeWidth={1.5} />;
              case actions.code:
                return <Code size={20} color={cores.foregroundMuted} strokeWidth={1.5} />;
              default:
                return null;
            }
          }}
          style={estilos.toolbarRich}
          actionTintColor={cores.foregroundMuted}
          selectedActionTintColor={cores.primary}
          disabled={carregando}
        />

        <ConfirmacaoDialog
          visivel={dialogRemoverTagVisivel}
          titulo="Remover tag?"
          mensagem={`A tag #${tagParaRemover ?? ""} será removida da nota.`}
          confirmarTexto="Remover"
          cancelarTexto="Cancelar"
          corDestaque="error"
          onConfirmar={confirmarRemoverTag}
          onCancelar={() => {
            setTagParaRemover(null);
            setDialogRemoverTagVisivel(false);
          }}
        />

        <DialogoInserirLink
          visivel={dialogoLinkVisivel}
          onConfirmar={(dados) => {
            editorRef.current?.insertLink(dados.texto, dados.url);
            setDialogoLinkVisivel(false);
          }}
          onCancelar={() => setDialogoLinkVisivel(false)}
        />

        <DialogoInserirLink
          visivel={dialogoEditarLinkVisivel}
          initialTexto={linkSelecionado?.texto ?? ""}
          initialUrl={linkSelecionado?.href ?? ""}
          onConfirmar={handleSalvarEdicaoLink}
          onCancelar={() => {
            setDialogoEditarLinkVisivel(false);
            setLinkSelecionado(null);
          }}
        />

        <MenuAcoesLink
          visivel={menuAcoesLinkVisivel}
          url={linkSelecionado?.href ?? ""}
          texto={linkSelecionado?.texto}
          onAbrir={handleAcaoAbrirLink}
          onEditar={handleAcaoEditarLink}
          onRemover={handleAcaoRemoverLink}
          onCancelar={() => {
            setMenuAcoesLinkVisivel(false);
            setLinkSelecionado(null);
          }}
        />
      </View>
    );
  },
);

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
    paddingHorizontal: espacamento.lg,
  },
  /* ===== Meta bar (tags + timestamp) ===== */
  linhaMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: espacamento.sm,
    gap: espacamento.xs,
  },
  linhaTagsScroll: {
    flex: 1,
  },
  linhaTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.tagBackground,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  tagChipTexto: {
    color: cores.tagText,
    fontSize: 12,
  },
  tagInputWrapper: {
    marginLeft: 4,
  },
  inputTag: {
    backgroundColor: cores.surfaceStrong,
    color: cores.foreground,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    fontSize: 13,
    minWidth: 80,
  },
  timestamp: {
    color: cores.foregroundMutedForeground,
    fontSize: 11,
  },
  /* ===== Inputs ===== */
  fieldGroup: {
    marginBottom: espacamento.md,
  },
  fieldGroupContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    marginLeft: 2,
  },
  labelAtiva: {
    color: cores.primary,
  },
  labelInativa: {
    color: cores.foregroundMuted,
  },
  inputTitulo: {
    backgroundColor: cores.surfaceStrong,
    color: cores.foreground,
    padding: espacamento.md,
    borderRadius: radius.md,
    fontSize: 18,
    fontWeight: "600",
  },
  inputConteudo: {
    flex: 1,
    backgroundColor: cores.surfaceStrong,
    borderRadius: radius.md,
    fontSize: 15,
  },
  /* ===== RichEditor + RichToolbar ===== */
  editor: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  toolbarRich: {
    backgroundColor: cores.surface,
    borderTopWidth: 1,
    borderTopColor: cores.border,
    height: 48,
    marginHorizontal: -espacamento.lg,
  },
});
