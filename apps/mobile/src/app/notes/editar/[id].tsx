import { type Note, NoteSchema } from "@devnote/contracts";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/api/client";
import { ConfirmacaoDialog } from "@/components/ui/ConfirmacaoDialog";
import { HeaderEdicaoNota } from "@/components/ui/HeaderEdicaoNota";
import { useAtualizarNota } from "@/hooks/api/useAtualizarNota";
import { useExcluirNota } from "@/hooks/api/useExcluirNota";
import type { FormularioNotaHandle } from "@/screens/notes/components/FormularioNota";
import { FormularioNota } from "@/screens/notes/components/FormularioNota";
import { cores, espacamento } from "@/styles/tokens";

/**
 * Tela de edição de nota existente.
 *
 * Direção clean: header com BotaoVoltar (Notas) — pin toggle — Salvar (spinner).
 * FormularioNota expõe submeter() via ref → header dispara.
 * Carrega nota via GET /notes/:id (TanStack Query) + Zod runtime validation.
 * Salva via PUT /notes/:id (optimistic concurrency via version).
 * fixada inicia de nota.isPinned e é state lifting pro ToggleFixar do header.
 */
export default function TelaEditarNota() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id ?? "";
  const insets = useSafeAreaInsets();
  const formRef = useRef<FormularioNotaHandle>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [fixada, setFixada] = useState(false);
  const [dialogVoltarVisivel, setDialogVoltarVisivel] = useState(false);
  const [dialogExcluirVisivel, setDialogExcluirVisivel] = useState(false);

  // Carrega nota existente — Zod valida em runtime
  const {
    data: nota,
    isLoading,
    error: loadError,
  } = useQuery<Note>({
    queryKey: ["nota", id],
    queryFn: async () => {
      const response = await apiFetch(`/notes/${id}`);

      if (!response.ok) {
        throw new Error("Nota não encontrada");
      }

      const json = await response.json();
      const parsed = NoteSchema.safeParse(json);

      if (!parsed.success) {
        throw new Error("Schema da API divergiu");
      }

      return parsed.data;
    },
    enabled: !!id,
  });

  // Sync do estado fixada pro header toda vez que a nota carrega
  useEffect(() => {
    if (nota) setFixada(nota.isPinned ?? false);
  }, [nota]);

  // isPending só importa quando a nota já está carregada
  const { mutate: atualizarNota, isPending } = useAtualizarNota();
  const { mutate: excluirNota, isPending: isExcluindo } = useExcluirNota();

  function confirmarExclusao() {
    if (!nota) return;
    excluirNota(
      { id: nota.id, version: nota.version },
      {
        onSuccess: () => {
          setDialogExcluirVisivel(false);
          router.back();
        },
        onError: (err) => {
          setDialogExcluirVisivel(false);
          setErro(err.message);
        },
      },
    );
  }

  /** Voltar com confirmação — só abre diálogo se o formulário estiver sujo. */
  function handleVoltar() {
    if (formRef.current?.estaSujo) {
      setDialogVoltarVisivel(true);
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
    if (!nota) return;

    setErro(null);

    atualizarNota(
      {
        id: nota.id,
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        tags: dados.tags,
        isPinned: dados.fixada,
        version: nota.version,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => setErro(err.message),
      },
    );
  }

  // Loading enquanto carrega nota
  if (isLoading) {
    return (
      <View
        style={[estilos.central, { backgroundColor: cores.background, paddingTop: insets.top }]}
        accessibilityLabel="Carregando nota"
      >
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  // Erro ao carregar
  if (loadError) {
    return (
      <View
        style={[estilos.central, { backgroundColor: cores.background, paddingTop: insets.top }]}
      >
        <Text style={[estilos.erroLoad, { color: cores.error }]}>
          {(loadError as Error).message}
        </Text>
      </View>
    );
  }

  if (!nota) return null;

  /** Fixar/desfixar com persistência imediata + rollback em caso de erro. */
  function handleFixar() {
    if (!nota) return;
    const novoValor = !fixada;
    setFixada(novoValor);
    atualizarNota(
      { id: nota.id, isPinned: novoValor, version: nota.version },
      {
        onError: () => {
          setFixada(!novoValor); // rollback no estado local
          setErro("Não foi possível atualizar a fixação");
        },
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
          voltarLabel="Notas"
          onVoltar={handleVoltar}
          fixada={fixada}
          onFixar={handleFixar}
          onExcluir={() => setDialogExcluirVisivel(true)}
          onSalvar={() => formRef.current?.submeter()}
          carregando={isPending || isExcluindo}
          headerStyle={{ backgroundColor: cores.background }}
        />
      </View>

      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

      <FormularioNota
        ref={formRef}
        nota={nota}
        onSubmit={handleSubmit}
        carregando={isPending}
        fixada={fixada}
      />

      <ConfirmacaoDialog
        visivel={dialogVoltarVisivel}
        titulo="Descartar alterações?"
        mensagem="As mudanças não foram salvas e serão perdidas."
        confirmarTexto="Descartar"
        cancelarTexto="Continuar editando"
        corDestaque="error"
        onConfirmar={() => {
          setDialogVoltarVisivel(false);
          router.back();
        }}
        onCancelar={() => setDialogVoltarVisivel(false)}
      />

      <ConfirmacaoDialog
        visivel={dialogExcluirVisivel}
        titulo="Excluir nota?"
        mensagem={`A nota "${nota.title || "Sem título"}" será excluída. Deseja continuar?`}
        confirmarTexto="Excluir"
        cancelarTexto="Cancelar"
        corDestaque="error"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setDialogExcluirVisivel(false)}
      />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
  },
  central: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  erro: {
    color: cores.error,
    fontSize: 14,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
    textAlign: "center",
  },
  erroLoad: {
    marginTop: espacamento.lg,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: espacamento.lg,
  },
});
