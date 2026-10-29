import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmacaoDialog } from "@/components/ui/ConfirmacaoDialog";
import { HeaderEdicaoNota } from "@/components/ui/HeaderEdicaoNota";
import { useCriarNota } from "@/hooks/api/useCriarNota";
import type { FormularioNotaHandle } from "@/screens/notes/components/FormularioNota";
import { FormularioNota } from "@/screens/notes/components/FormularioNota";
import { cores, espacamento } from "@/styles/tokens";

/**
 * Tela de criação de nota (nova).
 *
 * Direção clean: header "Cancelar" (texto, sem chevron) — pin toggle (local) — Salvar (spinner).
 * - Cancelar abre Alert.confirm se houver conteúdo não salvo (esteSujo via ref).
 * - Pin é local (envia no submit — não há nota persistida ainda).
 * - KeyboardAvoidingView: toolbar markdown sobe com o teclado.
 */
export default function TelaNovaNota() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formRef = useRef<FormularioNotaHandle>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [fixada, setFixada] = useState(false);
  const [dialogCancelarVisivel, setDialogCancelarVisivel] = useState(false);

  const { mutate: criarNota, isPending } = useCriarNota();

  /** Cancelar com confirmação — só abre diálogo se houver conteúdo não salvo. */
  function handleCancelar() {
    if (formRef.current?.estaSujo) {
      setDialogCancelarVisivel(true);
    } else {
      router.back();
    }
  }

  function handleSubmit(dados: {
    titulo: string;
    conteudo: string;
    tags: string[];
    fixada: boolean;
  }) {
    setErro(null);
    criarNota(
      {
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        tags: dados.tags,
        fixada: dados.fixada,
      },
      {
        onError: (err) => setErro(err.message),
        onSuccess: () => router.back(), // volta pra lista (cache invalidado pelo hook)
      },
    );
  }

  return (
    <KeyboardAvoidingView
      style={estilos.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
    >
      <View style={{ paddingTop: insets.top }}>
        <HeaderEdicaoNota
          voltarLabel="Cancelar"
          onVoltar={handleCancelar}
          fixada={fixada}
          onFixar={() => setFixada(!fixada)}
          onSalvar={() => formRef.current?.submeter()}
          carregando={isPending}
          headerStyle={{ backgroundColor: cores.background }}
        />
      </View>

      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

      <FormularioNota
        ref={formRef}
        onSubmit={handleSubmit}
        carregando={isPending}
        fixada={fixada}
      />

      <ConfirmacaoDialog
        visivel={dialogCancelarVisivel}
        titulo="Descartar nota?"
        mensagem="A nota não foi salva e será perdida."
        confirmarTexto="Descartar"
        cancelarTexto="Continuar editando"
        corDestaque="error"
        onConfirmar={() => {
          setDialogCancelarVisivel(false);
          router.back();
        }}
        onCancelar={() => setDialogCancelarVisivel(false)}
      />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
  },
  erro: {
    color: cores.error,
    fontSize: 14,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
    textAlign: "center",
  },
});
