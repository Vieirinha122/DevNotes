import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { cores, espacamento, radius, tipografia, toqueMinimo } from "@/styles/tokens";

interface ConfirmacaoDialogProps {
  /** Controla visibilidade do modal */
  visivel: boolean;
  /** Título do motivo da confirmação */
  titulo: string;
  /** Mensagem explicativa (opcional) */
  mensagem?: string;
  /** Texto do botão de confirmação (default: "Confirmar") */
  confirmarTexto?: string;
  /** Texto do botão de cancelamento (default: "Cancelar") */
  cancelarTexto?: string;
  /** Ação ao confirmar — sempre limpa o dialog externo */
  onConfirmar: () => void;
  /** Ação ao cancelar — sempre limpa o dialog externo */
  onCancelar: () => void;
  /** "primary" (verde), "error" (vermelho), "default" (cinza) */
  corDestaque?: "primary" | "error" | "default";
}

/**
 * Modal de confirmação customizado — substitui Alert.alert.
 *
 * Por que usar Modal ao invés de Alert: Alert é nativo e não permite
 * customização visual. Modal + tokens do design system mantém a estética
 * dark-first, radius e tipografia consistentes em toda a app.
 *
 * Padrão: overlay escuro semi-transparente + card surfaceStrong +
 * borda sutil (uma lateral só, heurística do vault) + radius dosado.
 */
export function ConfirmacaoDialog({
  visivel,
  titulo,
  mensagem,
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
  onConfirmar,
  onCancelar,
  corDestaque = "primary",
}: ConfirmacaoDialogProps) {
  function handleConfirmar() {
    onConfirmar();
  }

  function handleCancelar() {
    onCancelar();
  }

  const corBotao =
    corDestaque === "error"
      ? cores.error
      : corDestaque === "default"
        ? cores.foregroundMuted
        : cores.primary;

  return (
    <Modal
      transparent
      visible={visivel}
      animationType="fade"
      onRequestClose={handleCancelar}
      statusBarTranslucent
    >
      {/* Overlay escuro — toca fora do card cancela */}
      <TouchableOpacity
        style={estilos.overlay}
        activeOpacity={1}
        onPress={handleCancelar}
        accessibilityRole="button"
        accessibilityLabel="Fecher"
      >
        {/* Card — impede propagação do toque */}
        <TouchableOpacity
          activeOpacity={1}
          style={[estilos.card, { borderLeftColor: corBotao }]}
          onPress={() => {}} // noop: evita fechar ao tocar dentro
        >
          <Text style={[tipografia.h3, { color: cores.foreground, marginBottom: espacamento.xs }]}>
            {titulo}
          </Text>

          {mensagem ? (
            <Text style={[estilos.mensagem, { color: cores.foregroundMuted }]}>{mensagem}</Text>
          ) : null}

          <View style={estilos.botoes}>
            <TouchableOpacity
              style={[estilos.botaoCancelar, { borderColor: cores.border }]}
              onPress={handleCancelar}
              accessibilityRole="button"
              accessibilityLabel={cancelarTexto}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[estilos.textoCancelar, { color: cores.foregroundMuted }]}>
                {cancelarTexto}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.botaoConfirmar, { backgroundColor: corBotao }]}
              onPress={handleConfirmar}
              accessibilityRole="button"
              accessibilityLabel={confirmarTexto}
              accessibilityHint="Confirma a ação"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[estilos.textoConfirmar, { color: cores.primaryForeground }]}>
                {confirmarTexto}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espacamento.lg,
  },
  card: {
    backgroundColor: cores.surfaceStrong,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: cores.primary,
    padding: espacamento.lg,
    width: "100%",
    maxWidth: 360,
    gap: espacamento.sm,
  },
  mensagem: {
    fontSize: 14,
    lineHeight: 20,
  },
  botoes: {
    flexDirection: "row",
    gap: espacamento.xs,
    marginTop: espacamento.sm,
    justifyContent: "flex-end",
  },
  botaoCancelar: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: cores.border,
    paddingHorizontal: espacamento.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  textoCancelar: {
    fontSize: 15,
    fontWeight: "500",
  },
  botaoConfirmar: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    borderRadius: radius.md,
    paddingHorizontal: espacamento.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  textoConfirmar: {
    fontSize: 15,
    fontWeight: "600",
  },
});
