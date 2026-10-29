import { ExternalLink, Pencil, Unlink } from "lucide-react-native";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { cores, espacamento, radius, tipografia, toqueMinimo } from "@/styles/tokens";

interface MenuAcoesLinkProps {
  visivel: boolean;
  url: string;
  texto?: string;
  onAbrir: () => void;
  onEditar: () => void;
  onRemover: () => void;
  onCancelar: () => void;
}

/**
 * Menu de ações de link tocado no editor rich.
 *
 * Oferece três ações claras:
 * 1. Abrir link no navegador externo.
 * 2. Editar texto ou URL (abre DialogoInserirLink pré-preenchido).
 * 3. Desvincular link (mantém o texto puro sem a tag <a>).
 */
export function MenuAcoesLink({
  visivel,
  url,
  texto,
  onAbrir,
  onEditar,
  onRemover,
  onCancelar,
}: MenuAcoesLinkProps) {
  return (
    <Modal
      transparent
      visible={visivel}
      animationType="fade"
      onRequestClose={onCancelar}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={estilos.overlay}
        activeOpacity={1}
        onPress={onCancelar}
        accessibilityRole="button"
        accessibilityLabel="Fechar menu de ações do link"
      >
        <TouchableOpacity
          activeOpacity={1}
          style={estilos.card}
          onPress={() => {}} // evita fechar ao tocar dentro do card
        >
          <View style={estilos.header}>
            <Text style={[tipografia.h3, { color: cores.foreground }]} numberOfLines={1}>
              {texto || "Ações do link"}
            </Text>
            <Text style={estilos.subtituloUrl} numberOfLines={1}>
              {url}
            </Text>
          </View>

          <View style={estilos.opcoes}>
            <TouchableOpacity
              style={estilos.opcaoBotao}
              onPress={onAbrir}
              accessibilityRole="button"
              accessibilityLabel="Abrir link no navegador"
            >
              <ExternalLink size={18} color={cores.primary} strokeWidth={2} />
              <Text style={[estilos.opcaoTexto, { color: cores.primary }]}>
                Abrir no navegador
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.opcaoBotao}
              onPress={onEditar}
              accessibilityRole="button"
              accessibilityLabel="Editar texto ou URL do link"
            >
              <Pencil size={18} color={cores.foreground} strokeWidth={1.75} />
              <Text style={[estilos.opcaoTexto, { color: cores.foreground }]}>
                Editar link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.opcaoBotao}
              onPress={onRemover}
              accessibilityRole="button"
              accessibilityLabel="Remover link mantendo o texto"
            >
              <Unlink size={18} color={cores.error} strokeWidth={1.75} />
              <Text style={[estilos.opcaoTexto, { color: cores.error }]}>
                Remover link
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={estilos.botaoCancelar}
            onPress={onCancelar}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
          >
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 10, 15, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: espacamento.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: cores.surfaceStrong,
    borderRadius: radius.lg,
    padding: espacamento.lg,
    borderLeftWidth: 3,
    borderLeftColor: cores.primary,
    borderWidth: 1,
    borderColor: cores.border,
  },
  header: {
    marginBottom: espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
    paddingBottom: espacamento.sm,
  },
  subtituloUrl: {
    fontSize: 12,
    color: cores.foregroundMutedForeground,
    marginTop: 2,
  },
  opcoes: {
    gap: espacamento.xs,
    marginBottom: espacamento.sm,
  },
  opcaoBotao: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacamento.md,
    minHeight: toqueMinimo,
    paddingHorizontal: espacamento.md,
    borderRadius: radius.md,
    backgroundColor: cores.surface,
  },
  opcaoTexto: {
    fontSize: 14,
    fontWeight: "500",
  },
  botaoCancelar: {
    minHeight: toqueMinimo - 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: cores.border,
    marginTop: espacamento.xs,
  },
  textoCancelar: {
    color: cores.foregroundMuted,
    fontSize: 14,
    fontWeight: "500",
  },
});
