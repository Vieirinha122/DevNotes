import { Pin, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { ConfirmacaoDialog } from "@/components/ui/ConfirmacaoDialog";
import type { Note } from "@/hooks/api/useNotas";
import { cores, espacamento, radius } from "@/styles/tokens";
import { formatarTimestamp } from "@/utils/formatarData";

/** Mapeia kind técnico (NOTE, CHECKLIST...) pra label amigável na UI. */
const ETIQUETA_KIND: Record<string, string> = {
  NOTE: "Nota",
  CHECKLIST: "Checklist",
  SNIPPET: "Snippet",
  SOLUTION: "Solução",
};

interface NoteCardProps {
  nota: Note;
  onEditar: (id: string) => void;
  onExcluir: (id: string) => void;
}

/**
 * Card visual de uma nota.
 * - Swipe esquerdo revela botão vermelho "Excluir" (com confirmação via Alert)
 * - Tap abre edição
 * - Nota fixada tem border-left verde (cores.primary)
 *
 * Tokens via src/styles/tokens.ts.
 * Acessibilidade: labels em interações, badge com accessibilityLabel.
 */
export function NoteCard({ nota, onEditar, onExcluir }: NoteCardProps) {
  const [dialogExcluirVisivel, setDialogExcluirVisivel] = useState(false);

  // Abre diálogo de confirmação pra exclusão (ação destrutiva)
  function handleExcluir() {
    setDialogExcluirVisivel(true);
  }

  // Botão de ação que aparece ao swiper pra esquerda
  function RightActions() {
    return (
      <TouchableOpacity
        style={estilos.botaoExcluirSwipe}
        onPress={handleExcluir}
        accessibilityLabel={`Excluir nota ${nota.title || "Sem título"}`}
        accessibilityHint="Remove esta nota permanentemente"
      >
        <Text style={estilos.botaoExcluirTexto}>Excluir</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <Swipeable
        renderRightActions={() => <RightActions />}
        overshootRight={false}
        containerStyle={{ marginBottom: espacamento.sm }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onEditar(nota.id)}
          accessibilityRole="button"
          accessibilityLabel={`Editar nota: ${nota.title || "Sem título"}`}
          accessibilityHint="Toque para editar esta nota"
        >
          <View style={[estilos.card, nota.isPinned && estilos.cardFixada]}>
            {/* Badge de fixada no canto superior */}
            {nota.isPinned && (
              <View style={estilos.badgeFixada} accessibilityLabel="Nota fixada">
                <Pin size={14} color={cores.primary} fill={cores.primary} strokeWidth={1.5} />
              </View>
            )}

            <Text style={estilos.titulo} numberOfLines={1}>
              {nota.title || "Sem título"}
            </Text>

            {nota.content ? (
              <Text style={estilos.conteudo} numberOfLines={3}>
                {nota.content}
              </Text>
            ) : null}

            {/* Tags */}
            {nota.tags.length > 0 && (
              <View style={estilos.linhaTags}>
                {nota.tags.map((tag) => (
                  <View key={tag} style={estilos.tag}>
                    <Text style={estilos.tagTexto}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Footer: data relativa + kind label + botão lixeira */}
            <View style={estilos.footer}>
              <View style={estilos.footerInfo}>
                <Text style={estilos.dataTexto}>{formatarTimestamp(nota.createdAt)}</Text>
                <Text style={estilos.kindTexto}>{ETIQUETA_KIND[nota.kind] ?? nota.kind}</Text>
              </View>
              <TouchableOpacity
                onPress={handleExcluir}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Excluir nota ${nota.title || "Sem título"}`}
                style={estilos.botaoExcluirCard}
              >
                <Trash2 size={16} color={cores.foregroundMutedForeground} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>

      <ConfirmacaoDialog
        visivel={dialogExcluirVisivel}
        titulo="Excluir nota?"
        mensagem={`A nota "${nota.title || "Sem título"}" será removida e não pode ser recuperada.`}
        confirmarTexto="Excluir"
        cancelarTexto="Cancelar"
        corDestaque="error"
        onConfirmar={() => {
          setDialogExcluirVisivel(false);
          onExcluir(nota.id);
        }}
        onCancelar={() => setDialogExcluirVisivel(false)}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: cores.surfaceStrong,
    borderRadius: radius.md,
    padding: espacamento.lg,
  },
  cardFixada: {
    borderLeftWidth: 3,
    borderLeftColor: cores.primary,
  },
  titulo: {
    color: cores.foreground,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: espacamento.xs,
  },
  conteudo: {
    color: cores.foregroundMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: espacamento.sm,
  },
  linhaTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: espacamento.sm,
  },
  tag: {
    backgroundColor: cores.tagBackground,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagTexto: {
    color: cores.tagText,
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacamento.sm,
  },
  botaoExcluirCard: {
    padding: 4,
    borderRadius: radius.sm,
  },
  dataTexto: {
    color: cores.foregroundMutedForeground,
    fontSize: 12,
  },
  kindTexto: {
    color: cores.foregroundMutedForeground,
    fontSize: 11,
    textTransform: "uppercase",
  },
  badgeFixada: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 2,
  },
  botaoExcluirSwipe: {
    backgroundColor: cores.swipeDeleteBackground,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: radius.md,
    marginVertical: espacamento.sm,
  },
  botaoExcluirTexto: {
    color: cores.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
});
