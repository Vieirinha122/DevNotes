import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { cores, espacamento, radius, tipografia, toqueMinimo } from "@/styles/tokens";

interface DialogoInserirLinkProps {
  visivel: boolean;
  initialTexto?: string;
  initialUrl?: string;
  onConfirmar: (dados: { texto: string; url: string }) => void;
  onCancelar: () => void;
}

/**
 * Diálogo modal para inserção e edição de links no editor rich.
 *
 * Suporta criação (vazio) e edição (com initialTexto e initialUrl pré-preenchidos).
 * Substitui o window.prompt / AlertDialog padrão do Android por um modal estilizado
 * alinhado aos tokens do design system do DevNotes (dark-first, surfaceStrong, border, primary).
 */
export function DialogoInserirLink({
  visivel,
  initialTexto = "",
  initialUrl = "",
  onConfirmar,
  onCancelar,
}: DialogoInserirLinkProps) {
  const [texto, setTexto] = useState(initialTexto);
  const [url, setUrl] = useState(initialUrl);

  const ehEdicao = Boolean(initialUrl);

  useEffect(() => {
    if (visivel) {
      setTexto(initialTexto);
      setUrl(initialUrl);
    }
  }, [visivel, initialTexto, initialUrl]);

  function handleFechar() {
    setTexto("");
    setUrl("");
    onCancelar();
  }

  function handleConfirmar() {
    const urlLimpa = url.trim();
    if (!urlLimpa) return;

    // Normaliza URL adicionando https:// se não tiver protocolo
    const urlFormatada = /^https?:\/\//i.test(urlLimpa) ? urlLimpa : `https://${urlLimpa}`;

    onConfirmar({
      texto: texto.trim() || urlFormatada,
      url: urlFormatada,
    });

    setTexto("");
    setUrl("");
  }

  return (
    <Modal
      transparent
      visible={visivel}
      animationType="fade"
      onRequestClose={handleFechar}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={estilos.overlay}
        activeOpacity={1}
        onPress={handleFechar}
        accessibilityRole="button"
        accessibilityLabel="Fechar diálogo de link"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={estilos.keyboardContainer}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={estilos.card}
            onPress={() => {}} // evita fechar ao tocar dentro do card
          >
            <Text style={[tipografia.h3, { color: cores.foreground, marginBottom: espacamento.md }]}>
              {ehEdicao ? "Editar link" : "Inserir link"}
            </Text>

            <View style={estilos.grupoInput}>
              <Text style={estilos.label}>Texto exibido (opcional)</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ex: Minha documentação"
                placeholderTextColor={cores.foregroundMutedForeground}
                value={texto}
                onChangeText={setTexto}
                autoCapitalize="sentences"
              />
            </View>

            <View style={estilos.grupoInput}>
              <Text style={estilos.label}>URL</Text>
              <TextInput
                style={estilos.input}
                placeholder="https://exemplo.com"
                placeholderTextColor={cores.foregroundMutedForeground}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus
              />
            </View>

            <View style={estilos.botoes}>
              <TouchableOpacity
                style={[estilos.botao, estilos.botaoCancelar]}
                onPress={handleFechar}
                accessibilityRole="button"
                accessibilityLabel="Cancelar inserção de link"
              >
                <Text style={estilos.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.botao, estilos.botaoConfirmar]}
                onPress={handleConfirmar}
                disabled={!url.trim()}
                accessibilityRole="button"
                accessibilityLabel={ehEdicao ? "Salvar link" : "Inserir link"}
              >
                <Text
                  style={[
                    estilos.textoConfirmar,
                    !url.trim() && { opacity: 0.5 },
                  ]}
                >
                  {ehEdicao ? "Salvar" : "Inserir"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    width: "100%",
    alignItems: "center",
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
  grupoInput: {
    marginBottom: espacamento.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: cores.foregroundMuted,
    marginBottom: espacamento.xs,
  },
  input: {
    backgroundColor: cores.surface,
    color: cores.foreground,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
    borderRadius: radius.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: cores.border,
  },
  botoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: espacamento.sm,
    marginTop: espacamento.sm,
  },
  botao: {
    minHeight: toqueMinimo,
    paddingHorizontal: espacamento.lg,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  botaoCancelar: {
    borderWidth: 1,
    borderColor: cores.border,
    backgroundColor: "transparent",
  },
  textoCancelar: {
    color: cores.foregroundMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  botaoConfirmar: {
    backgroundColor: cores.primary,
  },
  textoConfirmar: {
    color: cores.primaryForeground,
    fontSize: 14,
    fontWeight: "600",
  },
});

